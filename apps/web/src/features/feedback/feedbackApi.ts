import type { ApiSuccessResponse, Feedback } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function submitFeedback(message: string) {
  const res = await apiClient.post<ApiSuccessResponse<Feedback>>("/feedback", {
    message,
    page: window.location.pathname,
  });
  return res.data.data;
}
