import type { ApiSuccessResponse, JobLead } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function discoverJobLeads(jobIntelId: string) {
  const res = await apiClient.post<ApiSuccessResponse<JobLead[]>>("/job-leads", { jobIntelId });
  return res.data.data;
}

export async function fetchJobLeads(jobIntelId: string) {
  const res = await apiClient.get<ApiSuccessResponse<JobLead[]>>(`/job-leads/by-job/${jobIntelId}`);
  return res.data.data;
}

export async function addJobLeadToContacts(id: string, email: string) {
  const res = await apiClient.post<ApiSuccessResponse<JobLead>>(`/job-leads/${id}/add-to-contacts`, { email });
  return res.data.data;
}
