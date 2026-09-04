import type { JobLead } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function discoverJobLeads(
  jobIntelId: string,
  options?: { broaden?: boolean; locationOverride?: string },
) {
  const res = await apiClient.post<JobLead[]>("/job-leads/", {
    jobIntelId,
    broaden: options?.broaden ?? false,
    locationOverride: options?.locationOverride || undefined,
  });
  return res.data;
}

export async function fetchJobLeads(jobIntelId: string) {
  const res = await apiClient.get<JobLead[]>(`/job-leads/by-job/${jobIntelId}`);
  return res.data;
}

export async function addJobLeadToContacts(id: string, email?: string) {
  const res = await apiClient.post<JobLead>(`/job-leads/${id}/add-to-contacts`, { email: email || undefined });
  return res.data;
}
