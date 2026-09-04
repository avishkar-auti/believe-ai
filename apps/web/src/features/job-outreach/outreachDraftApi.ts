import type { DraftStatus, OutreachDraft, OutreachDraftEditedText, OutreachDraftIntent } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function generateOutreachDrafts(
  jobIntelId: string,
  contactIds: string[],
  resumeId?: string,
  intent: OutreachDraftIntent = "outreach",
) {
  const res = await apiClient.post<OutreachDraft[]>("/outreach-drafts/", { jobIntelId, contactIds, resumeId, intent });
  return res.data;
}

export async function fetchOutreachDrafts(jobIntelId: string) {
  const res = await apiClient.get<OutreachDraft[]>(`/outreach-drafts/by-job/${jobIntelId}`);
  return res.data;
}

export async function decideOutreachDraft(id: string, status: DraftStatus, editedText?: OutreachDraftEditedText | null) {
  const res = await apiClient.patch<OutreachDraft>(`/outreach-drafts/${id}`, { status, editedText });
  return res.data;
}
