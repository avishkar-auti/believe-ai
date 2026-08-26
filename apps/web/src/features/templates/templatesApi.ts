import type { CreateTemplateInput, Template } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchTemplates() {
  const res = await apiClient.get<Template[]>("/templates/");
  return res.data;
}

export async function createTemplate(input: CreateTemplateInput) {
  const res = await apiClient.post<Template>("/templates/", input);
  return res.data;
}

export async function deleteTemplate(id: string) {
  await apiClient.delete(`/templates/${id}`);
}

export async function duplicateTemplate(id: string) {
  const res = await apiClient.post<Template>(`/templates/${id}/duplicate`);
  return res.data;
}
