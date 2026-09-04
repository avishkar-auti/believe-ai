import type { Achievement, CreateAchievementInput, UpdateAchievementInput } from "@believe-ai/shared";
import { apiClient } from "../../../lib/apiClient.js";

export async function fetchAchievements() {
  const res = await apiClient.get<Achievement[]>("/profile/achievements/");
  return res.data;
}

export async function createAchievement(input: CreateAchievementInput) {
  const res = await apiClient.post<Achievement>("/profile/achievements/", input);
  return res.data;
}

export async function updateAchievement(id: string, input: UpdateAchievementInput) {
  const res = await apiClient.patch<Achievement>(`/profile/achievements/${id}`, input);
  return res.data;
}

export async function deleteAchievement(id: string) {
  await apiClient.delete(`/profile/achievements/${id}`);
}

export async function reorderAchievements(orderedIds: string[]) {
  const res = await apiClient.patch<Achievement[]>("/profile/achievements/reorder", { orderedIds });
  return res.data;
}
