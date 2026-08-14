import type {
  ApiSuccessResponse,
  CreateJobInput,
  Job,
  JobFilterOptions,
  JobSearchFilters,
  PaginatedResult,
  UpdateJobInput,
} from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";
import { aiServiceClient } from "../../lib/aiServiceClient.js";

export async function searchJobs(filters: JobSearchFilters, page = 1) {
  const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<Job>>>("/jobs", {
    params: { ...filters, page },
  });
  return res.data.data;
}

export async function fetchJobFilterOptions() {
  const res = await apiClient.get<ApiSuccessResponse<JobFilterOptions>>("/jobs/filters");
  return res.data.data;
}

export async function toggleSaveJob(job: Job) {
  const res = await apiClient.post<ApiSuccessResponse<{ saved: boolean }>>(`/jobs/${job.id}/save`, {
    job: job.isSaved ? undefined : job,
  });
  return res.data.data;
}

export async function fetchMyJobs() {
  const res = await apiClient.get<ApiSuccessResponse<Job[]>>("/jobs/mine");
  return res.data.data;
}

export async function createJob(input: CreateJobInput) {
  const res = await apiClient.post<ApiSuccessResponse<Job>>("/jobs", input);
  return res.data.data;
}

export async function updateJob(id: string, input: UpdateJobInput) {
  const res = await apiClient.patch<ApiSuccessResponse<Job>>(`/jobs/${id}`, input);
  return res.data.data;
}

export async function deleteJob(id: string) {
  await apiClient.delete(`/jobs/${id}`);
}

export interface JobPostDraft {
  title: string;
  description: string;
  skills: string[];
  employmentType: "full_time" | "part_time" | "contract" | "internship";
}

// Drafting is a fresh, stateless generation (no stored data involved), so the
// web app calls the Python AI service directly, same as AI Writer.
export async function draftJobPost(roleTitle: string, company: string, briefDescription: string, seniority?: string) {
  const res = await aiServiceClient.post<JobPostDraft>("/ai/jobs/draft", {
    roleTitle,
    company,
    briefDescription,
    seniority,
  });
  return res.data;
}
