import type { OutreachFollowUp, OutreachSendLog } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function sendOutreachDraft(draftId: string) {
  const res = await apiClient.post<{ sendLogs: OutreachSendLog[] }>(`/outreach-drafts/${draftId}/send`);
  return res.data;
}

export async function fetchOutreachSendLogs(draftId: string) {
  const res = await apiClient.get<OutreachSendLog[]>(`/outreach-drafts/${draftId}/send-logs`);
  return res.data;
}

export async function fetchOutreachFollowUps(draftId: string) {
  const res = await apiClient.get<OutreachFollowUp[]>(`/outreach-drafts/${draftId}/follow-ups`);
  return res.data;
}

export async function markOutreachReplied(draftId: string) {
  await apiClient.post(`/outreach-drafts/${draftId}/mark-replied`);
}
