import type {
  CreateDesignProjectInput,
  CreateDesignScreenInput,
  DesignProject,
  DesignScreen,
  DesignScreenSummary,
  EditDesignScreenInput,
  UpdateDesignScreenPositionInput,
} from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchDesignProjects() {
  const res = await apiClient.get<DesignProject[]>("/design/projects/");
  return res.data;
}

export async function fetchDesignProject(id: string) {
  const res = await apiClient.get<DesignProject>(`/design/projects/${id}`);
  return res.data;
}

export async function createDesignProject(input: CreateDesignProjectInput) {
  const res = await apiClient.post<DesignProject>("/design/projects/", input);
  return res.data;
}

export async function deleteDesignProject(id: string) {
  await apiClient.delete(`/design/projects/${id}`);
}

export async function fetchDesignScreens(projectId: string) {
  const res = await apiClient.get<DesignScreenSummary[]>(`/design/projects/${projectId}/screens/`);
  return res.data;
}

export async function fetchDesignScreen(id: string) {
  const res = await apiClient.get<DesignScreen>(`/design/screens/${id}`);
  return res.data;
}

export async function createDesignScreen(projectId: string, input: CreateDesignScreenInput) {
  const res = await apiClient.post<DesignScreen>(`/design/projects/${projectId}/screens/`, input);
  return res.data;
}

export async function editDesignScreen(id: string, input: EditDesignScreenInput) {
  const res = await apiClient.patch<DesignScreen>(`/design/screens/${id}`, input);
  return res.data;
}

export async function deleteDesignScreen(id: string) {
  await apiClient.delete(`/design/screens/${id}`);
}

export async function updateDesignScreenPosition(id: string, input: UpdateDesignScreenPositionInput) {
  const res = await apiClient.patch<DesignScreen>(`/design/screens/${id}/position`, input);
  return res.data;
}
