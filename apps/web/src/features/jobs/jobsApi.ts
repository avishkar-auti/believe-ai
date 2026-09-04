import type { Job, JobFilterOptions, JobMatch, JobSearchFilters, PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function searchJobs(filters: JobSearchFilters, page = 1) {
  const res = await apiClient.get<PaginatedResult<Job>>("/jobs/", {
    params: { ...filters, page },
  });
  return res.data;
}

export async function fetchJobFilterOptions() {
  const res = await apiClient.get<JobFilterOptions>("/jobs/filters");
  return res.data;
}

export async function toggleSaveJob(job: Job) {
  const res = await apiClient.post<{ saved: boolean }>(`/jobs/${job.id}/save`, {
    job: job.isSaved ? undefined : job,
  });
  return res.data;
}

// Internal jobs can be re-fetched by id server-side; external (jsearch) ones
// only exist as the live payload the caller already holds from search results.
export async function fetchJobMatch(jobId: string, resumeId: string | undefined) {
  const res = await apiClient.get<JobMatch | null>(`/jobs/${jobId}/match`, { params: { resumeId } });
  return res.data;
}

export async function fetchJobMatchForJob(job: Job, resumeId: string | undefined) {
  const res = await apiClient.post<JobMatch | null>("/jobs/match", { job, resumeId });
  return res.data;
}
