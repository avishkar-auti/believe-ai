import type { CreateEducationInput, Education, UpdateEducationInput } from "@believe-ai/shared";
import { apiClient } from "../../../lib/apiClient.js";

export async function fetchEducation() {
  const res = await apiClient.get<Education[]>("/profile/education/");
  return res.data;
}

export async function createEducation(input: CreateEducationInput) {
  const res = await apiClient.post<Education>("/profile/education/", input);
  return res.data;
}

export async function updateEducation(id: string, input: UpdateEducationInput) {
  const res = await apiClient.patch<Education>(`/profile/education/${id}`, input);
  return res.data;
}

export async function deleteEducation(id: string) {
  await apiClient.delete(`/profile/education/${id}`);
}

export async function reorderEducation(orderedIds: string[]) {
  const res = await apiClient.patch<Education[]>("/profile/education/reorder", { orderedIds });
  return res.data;
}
