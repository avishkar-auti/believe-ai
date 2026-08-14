import type {
  AiCampaignInsightResult,
  ApiSuccessResponse,
  Campaign,
  CampaignAnalytics,
  CreateCampaignInput,
  EmailLog,
  PaginatedResult,
} from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";
import { aiServiceClient } from "../../lib/aiServiceClient.js";

export async function fetchCampaigns() {
  const res = await apiClient.get<ApiSuccessResponse<Campaign[]>>("/campaigns");
  return res.data.data;
}

export async function fetchCampaign(id: string) {
  const res = await apiClient.get<ApiSuccessResponse<Campaign>>(`/campaigns/${id}`);
  return res.data.data;
}

export async function createCampaign(input: CreateCampaignInput) {
  const res = await apiClient.post<ApiSuccessResponse<Campaign>>("/campaigns", input);
  return res.data.data;
}

async function transition(id: string, action: "launch" | "pause" | "resume" | "cancel") {
  const res = await apiClient.post<ApiSuccessResponse<Campaign>>(`/campaigns/${id}/${action}`);
  return res.data.data;
}

export const launchCampaign = (id: string) => transition(id, "launch");
export const pauseCampaign = (id: string) => transition(id, "pause");
export const resumeCampaign = (id: string) => transition(id, "resume");
export const cancelCampaign = (id: string) => transition(id, "cancel");

export async function fetchCampaignAnalytics(id: string) {
  const res = await apiClient.get<ApiSuccessResponse<CampaignAnalytics>>(`/campaigns/${id}/analytics`);
  return res.data.data;
}

export async function fetchCampaignRecipients(id: string, page = 1) {
  const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<EmailLog>>>(`/campaigns/${id}/recipients`, {
    params: { page },
  });
  return res.data.data;
}

export async function markRecipientReplied(campaignId: string, contactId: string) {
  await apiClient.post(`/campaigns/${campaignId}/recipients/${contactId}/mark-replied`);
}

/** Computed by the Python AI service directly from real stored EmailLog stats — no envelope. */
export async function fetchCampaignInsights(id: string) {
  const res = await aiServiceClient.get<AiCampaignInsightResult>(`/campaigns/${id}/insights`);
  return res.data;
}
