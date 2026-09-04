import type { PaginatedResult, Roadmap } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchRoadmaps() {
  const res = await apiClient.get<PaginatedResult<Roadmap>>("/roadmaps");
  return res.data;
}

export async function generateRoadmap(goal: string, personalize: boolean, resumeId?: string) {
  const res = await apiClient.post<Roadmap>("/roadmaps", { goal, personalize, resumeId });
  return res.data;
}

export async function deleteRoadmap(id: string) {
  await apiClient.delete(`/roadmaps/${id}`);
}
