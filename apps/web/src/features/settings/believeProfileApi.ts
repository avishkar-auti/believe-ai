import type { ApiSuccessResponse, UpdateUserContextInput, UserContext } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchBelieveProfile() {
  const res = await apiClient.get<ApiSuccessResponse<UserContext | null>>("/profile/context");
  return res.data.data;
}

export async function updateBelieveProfile(input: UpdateUserContextInput) {
  const res = await apiClient.put<ApiSuccessResponse<UserContext>>("/profile/context", input);
  return res.data.data;
}
