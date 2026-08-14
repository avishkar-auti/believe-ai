import type { ApiSuccessResponse, OutreachFollowUp, OutreachSendLog } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function sendOutreachDraft(draftId: string) {
  const res = await apiClient.post<ApiSuccessResponse<{ sendLogs: OutreachSendLog[] }>>(`/outreach-drafts/${draftId}/send`);
  return res.data.data;
}

export async function fetchOutreachSendLogs(draftId: string) {
  const res = await apiClient.get<ApiSuccessResponse<OutreachSendLog[]>>(`/outreach-drafts/${draftId}/send-logs`);
  return res.data.data;
}

export async function fetchOutreachFollowUps(draftId: string) {
  const res = await apiClient.get<ApiSuccessResponse<OutreachFollowUp[]>>(`/outreach-drafts/${draftId}/follow-ups`);
  return res.data.data;
}

export async function markOutreachReplied(draftId: string) {
  await apiClient.post(`/outreach-drafts/${draftId}/mark-replied`);
}
