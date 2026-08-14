import type { HydratedDocument } from "mongoose";
import type { CreateJobInput, DatePostedFilter, Job, JobFilterOptions, JobSearchFilters, UpdateJobInput } from "@believe-ai/shared";
import { MAX_PAGE_SIZE } from "@believe-ai/shared";
import type { JobDocument, SavedJobDocument } from "@believe-ai/server";
import { jobRepository } from "../repositories/job.repository.js";
import { savedJobRepository } from "../repositories/savedJob.repository.js";
import { searchExternalJobs } from "./jsearch.client.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";

const DATE_POSTED_MS: Record<Exclude<DatePostedFilter, "any">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

function datePostedToCutoff(datePosted: DatePostedFilter | undefined): Date | undefined {
  if (!datePosted || datePosted === "any") return undefined;
  return new Date(Date.now() - DATE_POSTED_MS[datePosted]);
}

function meetsSalaryFloor(job: Job, floor: number | undefined): boolean {
  if (floor == null) return true;
  const ceiling = job.salaryMax ?? job.salaryMin;
  return ceiling != null && ceiling >= floor;
}

function toDto(doc: HydratedDocument<JobDocument>): Job {
  return {
    id: doc._id.toString(),
    source: "internal",
    postedBy: doc.postedBy.toString(),
    title: doc.title,
    company: doc.company,
    location: doc.location ?? null,
    description: doc.description,
    skills: doc.skills ?? [],
    employmentType: (doc.employmentType as Job["employmentType"]) ?? null,
    workMode: (doc.workMode as Job["workMode"]) ?? null,
    experienceLevel: (doc.experienceLevel as Job["experienceLevel"]) ?? null,
    salaryMin: doc.salaryMin ?? null,
    salaryMax: doc.salaryMax ?? null,
    recruiterLinkedIn: doc.recruiterLinkedIn ?? null,
    applyUrl: doc.applyUrl ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toSavedDto(doc: HydratedDocument<SavedJobDocument>): Job {
  const s = doc.snapshot!;
  return {
    id: doc.jobId,
    source: s.source as Job["source"],
    postedBy: null,
    title: s.title,
    company: s.company,
    location: s.location ?? null,
    description: s.description ?? "",
    skills: s.skills ?? [],
    employmentType: (s.employmentType as Job["employmentType"]) ?? null,
    workMode: (s.workMode as Job["workMode"]) ?? null,
    experienceLevel: (s.experienceLevel as Job["experienceLevel"]) ?? null,
    salaryMin: s.salaryMin ?? null,
    salaryMax: s.salaryMax ?? null,
    recruiterLinkedIn: s.recruiterLinkedIn ?? null,
    applyUrl: s.applyUrl ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.createdAt.toISOString(),
    isSaved: true,
  };
}

export const jobService = {
  toDto,

  /**
   * Internal listings (paginated, always shown) plus a best-effort page of
   * external results (only when searching with a keyword — JSearch has no
   * "browse all" concept — and only when source isn't restricted to
   * "internal"). savedOnly bypasses this entirely and reads bookmarked
   * snapshots instead, since a saved external listing has no other home
   * once it falls off a live search page.
   */
  async search(filters: JobSearchFilters, page: number, limit: number, userId: string) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));

    if (filters.savedOnly) {
      const saved = await savedJobRepository.listByUser(userId);
      const start = (safePage - 1) * safeLimit;
      const pageDocs = saved.slice(start, start + safeLimit);
      return {
        items: pageDocs.map(toSavedDto),
        page: safePage,
        limit: safeLimit,
        total: saved.length,
        totalPages: Math.max(1, Math.ceil(saved.length / safeLimit)),
      };
    }

    const postedAfter = datePostedToCutoff(filters.datePosted);
    const includeExternal = filters.source !== "internal" && !!filters.q;

    const [[internalDocs, total], externalRaw, savedIds] = await Promise.all([
      jobRepository.search(
        {
          query: filters.q,
          location: filters.location,
          company: filters.company,
          employmentType: filters.employmentType,
          workMode: filters.workMode,
          experienceLevel: filters.experienceLevel,
          skill: filters.skill,
          source: filters.source,
          salaryMin: filters.salaryMin,
          postedAfter,
        },
        safePage,
        safeLimit,
      ),
      includeExternal ? searchExternalJobs(filters.q!, filters.datePosted) : Promise.resolve([]),
      savedJobRepository.savedJobIds(userId),
    ]);

    // External results can't be filtered server-side by salary (JSearch doesn't expose it as a query
    // param), so the floor is applied here once the salary fields it does return are available.
    const external = externalRaw.filter((j) => meetsSalaryFloor(j, filters.salaryMin));

    const items = [...internalDocs.map(toDto), ...external].map((j) => ({ ...j, isSaved: savedIds.has(j.id) }));

    return {
      items,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  },

  async getFilterOptions(): Promise<JobFilterOptions> {
    return jobRepository.distinctFacets();
  },

  /** Toggles a bookmark. Saving needs the job's display fields — for internal jobs we can re-fetch them,
   *  but external (jsearch) jobs only exist as a live API response, so the caller must supply them. */
  async toggleSave(userId: string, jobId: string, jobPayload?: Job): Promise<{ saved: boolean }> {
    const existing = await savedJobRepository.find(userId, jobId);
    if (existing) {
      await savedJobRepository.unsave(userId, jobId);
      return { saved: false };
    }

    let job = jobPayload;
    if (!job && !jobId.startsWith("jsearch:")) {
      const doc = await jobRepository.findById(jobId);
      if (doc) job = toDto(doc);
    }
    if (!job) throw new ValidationError("Job details are required to save this listing.");

    await savedJobRepository.save(userId, jobId, job);
    return { saved: true };
  },

  async getById(id: string): Promise<Job> {
    const doc = await jobRepository.findById(id);
    if (!doc) throw new NotFoundError("Job not found");
    return toDto(doc);
  },

  async listMine(userId: string): Promise<Job[]> {
    const docs = await jobRepository.listByPoster(userId);
    return docs.map(toDto);
  },

  async create(userId: string, input: CreateJobInput): Promise<Job> {
    const doc = await jobRepository.create({
      postedBy: userId,
      title: input.title,
      company: input.company,
      location: input.location ?? null,
      description: input.description,
      skills: input.skills ?? [],
      employmentType: input.employmentType ?? null,
      workMode: input.workMode ?? null,
      experienceLevel: input.experienceLevel ?? null,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      recruiterLinkedIn: input.recruiterLinkedIn ?? null,
      applyUrl: input.applyUrl ?? null,
    });
    return toDto(doc);
  },

  async update(id: string, userId: string, input: UpdateJobInput): Promise<Job> {
    const doc = await jobRepository.update(id, userId, input);
    if (!doc) throw new NotFoundError("Job not found");
    return toDto(doc);
  },

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await jobRepository.delete(id, userId);
    if (!deleted) throw new NotFoundError("Job not found");
  },
};
