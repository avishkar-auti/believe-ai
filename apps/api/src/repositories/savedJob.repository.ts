import { SavedJobModel } from "@believe-ai/server";
import type { Job } from "@believe-ai/shared";

function toSnapshot(job: Omit<Job, "id" | "postedBy" | "createdAt" | "updatedAt" | "isSaved">) {
  return {
    source: job.source,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    skills: job.skills,
    employmentType: job.employmentType,
    workMode: job.workMode,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    recruiterLinkedIn: job.recruiterLinkedIn,
    applyUrl: job.applyUrl,
  };
}

export const savedJobRepository = {
  /** Ids of every job this user has saved — used to annotate search results with isSaved. */
  async savedJobIds(userId: string): Promise<Set<string>> {
    const rows = await SavedJobModel.find({ userId }, { jobId: 1 });
    return new Set(rows.map((r) => r.jobId));
  },

  find(userId: string, jobId: string) {
    return SavedJobModel.findOne({ userId, jobId });
  },

  save(userId: string, jobId: string, job: Omit<Job, "id" | "postedBy" | "createdAt" | "updatedAt" | "isSaved">) {
    return SavedJobModel.create({ userId, jobId, snapshot: toSnapshot(job) });
  },

  unsave(userId: string, jobId: string) {
    return SavedJobModel.deleteOne({ userId, jobId });
  },

  listByUser(userId: string) {
    return SavedJobModel.find({ userId }).sort({ createdAt: -1 });
  },
};
