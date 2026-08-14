import type { ApiSuccessResponse, DraftStatus, OutreachDraft, OutreachDraftEditedText } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function generateOutreachDrafts(jobIntelId: string, contactIds: string[]) {
  const res = await apiClient.post<ApiSuccessResponse<OutreachDraft[]>>("/outreach-drafts", { jobIntelId, contactIds });
  return res.data.data;
}

export async function fetchOutreachDrafts(jobIntelId: string) {
  const res = await apiClient.get<ApiSuccessResponse<OutreachDraft[]>>(`/outreach-drafts/by-job/${jobIntelId}`);
  return res.data.data;
}

export async function decideOutreachDraft(id: string, status: DraftStatus, editedText?: OutreachDraftEditedText | null) {
  const res = await apiClient.patch<ApiSuccessResponse<OutreachDraft>>(`/outreach-drafts/${id}`, { status, editedText });
  return res.data.data;
}
