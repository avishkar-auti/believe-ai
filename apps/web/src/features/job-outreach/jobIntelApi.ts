import type { ApiSuccessResponse, JobIntel, PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchJobIntelList() {
  const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<JobIntel>>>("/job-intel");
  return res.data.data;
}

export async function analyzeJobUrl(jobUrl: string) {
  const res = await apiClient.post<ApiSuccessResponse<JobIntel>>("/job-intel", { jobUrl });
  return res.data.data;
}

export async function deleteJobIntel(id: string) {
  await apiClient.delete(`/job-intel/${id}`);
}
