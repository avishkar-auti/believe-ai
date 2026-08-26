import type { UpdateUserContextInput, UserContext } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchBelieveProfile() {
  const res = await apiClient.get<UserContext | null>("/profile/context/");
  return res.data;
}

export async function updateBelieveProfile(input: UpdateUserContextInput) {
  const res = await apiClient.put<UserContext>("/profile/context/", input);
  return res.data;
}
