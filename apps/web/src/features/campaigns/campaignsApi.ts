import type {
  AiCampaignInsightResult,
  AiEmailGenerationResult,
  AiPersonalizeResult,
  Campaign,
  CampaignAnalytics,
  CampaignLink,
  CreateCampaignInput,
  EmailEvent,
  EmailLog,
  EmailLogStatus,
  EngagementTimeseriesPoint,
  InsightActionCard,
  PaginatedResult,
  ProjectEngagement,
  RecipientSegment,
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

export async function deleteCampaign(id: string) {
  await apiClient.delete(`/campaigns/${id}`);
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

export interface RecipientFilters {
  status?: EmailLogStatus;
  segment?: RecipientSegment;
  search?: string;
}

export async function fetchCampaignRecipients(id: string, page = 1, filters: RecipientFilters = {}) {
  const res = await apiClient.get<PaginatedResult<EmailLog>>(`/campaigns/${id}/recipients`, {
    params: { page, ...filters },
  });
  return res.data;
}

export async function fetchRecipientTimeline(campaignId: string, contactId: string) {
  const res = await apiClient.get<EmailEvent[]>(`/campaigns/${campaignId}/recipients/${contactId}/timeline`);
  return res.data;
}

export async function markRecipientReplied(campaignId: string, contactId: string) {
  await apiClient.post(`/campaigns/${campaignId}/recipients/${contactId}/mark-replied`);
}

export async function fetchCampaignLinks(id: string) {
  const res = await apiClient.get<CampaignLink[]>(`/campaigns/${id}/links`);
  return res.data;
}

export async function fetchEngagementTimeseries(id: string) {
  const res = await apiClient.get<EngagementTimeseriesPoint[]>(`/campaigns/${id}/engagement-timeseries`);
  return res.data;
}

export async function fetchCampaignInsights(id: string) {
  const res = await apiClient.get<AiCampaignInsightResult>(`/campaigns/${id}/insights`);
  return res.data;
}

export async function personalizeForContact(campaignId: string, contactId: string) {
  const res = await apiClient.post<AiPersonalizeResult>(`/campaigns/${campaignId}/contacts/${contactId}/personalize`);
  return res.data;
}

export async function fetchCampaignProjects(id: string) {
  const res = await apiClient.get<ProjectEngagement[]>(`/campaigns/${id}/projects`);
  return res.data;
}

export async function fetchInsightCards(id: string) {
  const res = await apiClient.get<InsightActionCard[]>(`/campaigns/${id}/insight-cards`);
  return res.data;
}

export async function generateFollowUp(id: string) {
  const res = await apiClient.post<AiEmailGenerationResult>(`/campaigns/${id}/generate-follow-up`);
  return res.data;
}
