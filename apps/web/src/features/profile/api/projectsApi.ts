import type { CreatePortfolioProjectInput, PortfolioProject, UpdatePortfolioProjectInput } from "@believe-ai/shared";
import { apiClient } from "../../../lib/apiClient.js";

export async function fetchProjects() {
  const res = await apiClient.get<PortfolioProject[]>("/profile/projects/");
  return res.data;
}

export async function createProject(input: CreatePortfolioProjectInput) {
  const res = await apiClient.post<PortfolioProject>("/profile/projects/", input);
  return res.data;
}

export async function updateProject(id: string, input: UpdatePortfolioProjectInput) {
  const res = await apiClient.patch<PortfolioProject>(`/profile/projects/${id}`, input);
  return res.data;
}

export async function deleteProject(id: string) {
  await apiClient.delete(`/profile/projects/${id}`);
}

export async function reorderProjects(orderedIds: string[]) {
  const res = await apiClient.patch<PortfolioProject[]>("/profile/projects/reorder", { orderedIds });
  return res.data;
}
