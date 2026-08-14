import type { ApiSuccessResponse } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export type EmailIntegrationProvider = "gmail" | "outlook";

export interface IntegrationStatus {
  provider: EmailIntegrationProvider;
  email: string;
  connectedAt: string;
}

export async function fetchIntegrations() {
  const res = await apiClient.get<ApiSuccessResponse<IntegrationStatus[]>>("/integrations");
  return res.data.data;
}

export async function getConnectUrl(provider: EmailIntegrationProvider) {
  const res = await apiClient.post<ApiSuccessResponse<{ url: string }>>(`/integrations/${provider}/connect`);
  return res.data.data.url;
}

export async function disconnectProvider(provider: EmailIntegrationProvider) {
  await apiClient.delete(`/integrations/${provider}`);
}
