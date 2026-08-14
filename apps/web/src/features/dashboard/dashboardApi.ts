import type { ApiSuccessResponse, Campaign } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export interface DashboardSummary {
  totalContacts: number;
  emailsSent: number;
  emailsDelivered: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  activeCampaigns: number;
  scheduledCampaigns: number;
  recentCampaigns: Campaign[];
}

export async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await apiClient.get<ApiSuccessResponse<DashboardSummary>>("/analytics/dashboard");
  return res.data.data;
}
