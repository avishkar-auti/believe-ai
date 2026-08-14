import type { ApiSuccessResponse, AuditLog, PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchAuditLogs(limit = 20) {
  const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<AuditLog>>>("/audit-logs", {
    params: { limit },
  });
  return res.data.data;
}
