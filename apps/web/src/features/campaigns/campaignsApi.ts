import type {
  AiCampaignInsightResult,
  AiPersonalizeResult,
  Campaign,
  CampaignAnalytics,
  CreateCampaignInput,
  EmailLog,
  PaginatedResult,
} from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchCampaigns() {
  const res = await apiClient.get<Campaign[]>("/campaigns/");
  return res.data;
}

export async function fetchCampaign(id: string) {
  const res = await apiClient.get<Campaign>(`/campaigns/${id}`);
  return res.data;
}

export async function createCampaign(input: CreateCampaignInput) {
  const res = await apiClient.post<Campaign>("/campaigns/", input);
  return res.data;
}

async function transition(id: string, action: "launch" | "pause" | "resume" | "cancel") {
  const res = await apiClient.post<Campaign>(`/campaigns/${id}/${action}`);
  return res.data;
}

export const launchCampaign = (id: string) => transition(id, "launch");
export const pauseCampaign = (id: string) => transition(id, "pause");
export const resumeCampaign = (id: string) => transition(id, "resume");
export const cancelCampaign = (id: string) => transition(id, "cancel");

export async function fetchCampaignAnalytics(id: string) {
  const res = await apiClient.get<CampaignAnalytics>(`/campaigns/${id}/analytics`);
  return res.data;
}

export async function fetchCampaignRecipients(id: string, page = 1) {
  const res = await apiClient.get<PaginatedResult<EmailLog>>(`/campaigns/${id}/recipients`, {
    params: { page },
  });
  return res.data;
}

export async function markRecipientReplied(campaignId: string, contactId: string) {
  await apiClient.post(`/campaigns/${campaignId}/recipients/${contactId}/mark-replied`);
}

export async function fetchCampaignInsights(id: string) {
  const res = await apiClient.get<AiCampaignInsightResult>(`/campaigns/${id}/insights`);
  return res.data;
}

export async function personalizeForContact(campaignId: string, contactId: string) {
  const res = await apiClient.post<AiPersonalizeResult>(`/campaigns/${campaignId}/contacts/${contactId}/personalize`);
  return res.data;
}
