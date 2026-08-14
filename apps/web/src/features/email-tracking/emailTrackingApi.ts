import type { ApiSuccessResponse, EmailTrackingEntry, PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchEmailTracking(params: { page?: number }) {
  const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<EmailTrackingEntry>>>("/analytics/emails", {
    params,
  });
  return res.data.data;
}
