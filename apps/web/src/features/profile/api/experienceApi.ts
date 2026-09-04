import type { CreateExperienceInput, Experience, UpdateExperienceInput } from "@believe-ai/shared";
import { apiClient } from "../../../lib/apiClient.js";

export async function fetchExperience() {
  const res = await apiClient.get<Experience[]>("/profile/experience/");
  return res.data;
}

export async function createExperience(input: CreateExperienceInput) {
  const res = await apiClient.post<Experience>("/profile/experience/", input);
  return res.data;
}

export async function updateExperience(id: string, input: UpdateExperienceInput) {
  const res = await apiClient.patch<Experience>(`/profile/experience/${id}`, input);
  return res.data;
}

export async function deleteExperience(id: string) {
  await apiClient.delete(`/profile/experience/${id}`);
}

export async function reorderExperience(orderedIds: string[]) {
  const res = await apiClient.patch<Experience[]>("/profile/experience/reorder", { orderedIds });
  return res.data;
}
