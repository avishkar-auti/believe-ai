import type { EmailTrackingEntry, PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchEmailTracking(params: { page?: number }) {
  const res = await apiClient.get<PaginatedResult<EmailTrackingEntry>>("/analytics/emails", {
    params,
  });
  return res.data;
}
