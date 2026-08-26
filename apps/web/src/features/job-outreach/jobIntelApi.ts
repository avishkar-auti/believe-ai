import type { JobIntel, PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchJobIntelList() {
  const res = await apiClient.get<PaginatedResult<JobIntel>>("/job-intel/");
  return res.data;
}

export async function analyzeJobUrl(jobUrl: string) {
  const res = await apiClient.post<JobIntel>("/job-intel/", { jobUrl });
  return res.data;
}

export async function deleteJobIntel(id: string) {
  await apiClient.delete(`/job-intel/${id}`);
}
