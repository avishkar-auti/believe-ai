import { apiClient } from "../../lib/apiClient.js";

export type EmailIntegrationProvider = "gmail" | "outlook";

export interface IntegrationStatus {
  provider: EmailIntegrationProvider;
  email: string;
  connectedAt: string;
}

export async function fetchIntegrations() {
  const res = await apiClient.get<IntegrationStatus[]>("/integrations/");
  return res.data;
}

export async function getConnectUrl(provider: EmailIntegrationProvider) {
  const res = await apiClient.post<{ url: string }>(`/integrations/${provider}/connect`);
  return res.data.url;
}

export async function disconnectProvider(provider: EmailIntegrationProvider) {
  await apiClient.delete(`/integrations/${provider}`);
}
