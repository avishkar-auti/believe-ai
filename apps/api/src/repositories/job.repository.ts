import { JobModel } from "@believe-ai/server";
import type { EmploymentType, ExperienceLevel, JobSource, WorkMode } from "@believe-ai/shared";

export interface JobRecord {
  postedBy: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  skills: string[];
  employmentType: EmploymentType | null;
  workMode: WorkMode | null;
  experienceLevel: ExperienceLevel | null;
  salaryMin: number | null;
  salaryMax: number | null;
  recruiterLinkedIn: string | null;
  applyUrl: string | null;
}

export interface JobSearchFilters {
  query?: string;
  location?: string;
  company?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  experienceLevel?: ExperienceLevel;
  skill?: string;
  /** All jobs in this repository are "internal" — an explicit "jsearch" filter short-circuits to zero results, handled by the caller. */
  source?: JobSource;
  /** Floor — matches jobs whose range reaches at least this amount (falls back to salaryMin when no salaryMax is listed). */
  salaryMin?: number;
  postedAfter?: Date;
}

function buildFilter(filters: JobSearchFilters) {
  const clauses: Record<string, unknown>[] = [];

  if (filters.query) {
    const re = new RegExp(escapeRegex(filters.query), "i");
    clauses.push({ $or: [{ title: re }, { company: re }, { skills: re }] });
  }
  if (filters.location) clauses.push({ location: filters.location });
  if (filters.company) clauses.push({ company: filters.company });
  if (filters.employmentType) clauses.push({ employmentType: filters.employmentType });
  if (filters.workMode) clauses.push({ workMode: filters.workMode });
  if (filters.experienceLevel) clauses.push({ experienceLevel: filters.experienceLevel });
  if (filters.skill) clauses.push({ skills: new RegExp(escapeRegex(filters.skill), "i") });
  if (filters.salaryMin != null) {
    clauses.push({
      $or: [{ salaryMax: { $gte: filters.salaryMin } }, { salaryMax: null, salaryMin: { $gte: filters.salaryMin } }],
    });
  }
  if (filters.postedAfter) clauses.push({ createdAt: { $gte: filters.postedAfter } });

  return clauses.length > 0 ? { $and: clauses } : {};
}

export const jobRepository = {
  /** Search is a simple case-insensitive match plus exact-match facet filters — enough at this scale. */
  search(filters: JobSearchFilters, page: number, limit: number) {
    // Every row here is source: "internal" — an explicit external-only filter means no matches at all,
    // but the query still needs to run so the return type lines up with the normal path.
    const filter = filters.source === "jsearch" ? { _id: null } : buildFilter(filters);
    const skip = (page - 1) * limit;
    return Promise.all([
      JobModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      JobModel.countDocuments(filter),
    ]);
  },

  /** Distinct facet values for the filter sidebar, capped so a huge board doesn't blow up the dropdown. */
  async distinctFacets() {
    const [locations, companies, skills] = await Promise.all([
      JobModel.distinct("location", { location: { $ne: null } }),
      JobModel.distinct("company"),
      JobModel.distinct("skills"),
    ]);
    return {
      locations: locations.sort().slice(0, 100),
      companies: companies.sort().slice(0, 100),
      skills: skills.sort().slice(0, 100),
    };
  },

  findById(id: string) {
    return JobModel.findById(id);
  },

  listByPoster(userId: string) {
    return JobModel.find({ postedBy: userId }).sort({ createdAt: -1 });
  },

  create(data: JobRecord) {
    return JobModel.create(data);
  },

  update(id: string, postedBy: string, updates: Partial<JobRecord>) {
    return JobModel.findOneAndUpdate({ _id: id, postedBy }, updates, { new: true });
  },

  delete(id: string, postedBy: string) {
    return JobModel.findOneAndDelete({ _id: id, postedBy });
  },
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
