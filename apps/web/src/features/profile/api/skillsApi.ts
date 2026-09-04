import type { CreateSkillInput, Skill, UpdateSkillInput } from "@believe-ai/shared";
import { apiClient } from "../../../lib/apiClient.js";

export async function fetchSkills() {
  const res = await apiClient.get<Skill[]>("/profile/skills/");
  return res.data;
}

export async function createSkill(input: CreateSkillInput) {
  const res = await apiClient.post<Skill>("/profile/skills/", input);
  return res.data;
}

export async function updateSkill(id: string, input: UpdateSkillInput) {
  const res = await apiClient.patch<Skill>(`/profile/skills/${id}`, input);
  return res.data;
}

export async function deleteSkill(id: string) {
  await apiClient.delete(`/profile/skills/${id}`);
}

export async function reorderSkills(orderedIds: string[]) {
  const res = await apiClient.patch<Skill[]>("/profile/skills/reorder", { orderedIds });
  return res.data;
}
