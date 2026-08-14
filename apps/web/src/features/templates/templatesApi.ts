import type { ApiSuccessResponse, CreateTemplateInput, Template } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchTemplates() {
  const res = await apiClient.get<ApiSuccessResponse<Template[]>>("/templates");
  return res.data.data;
}

export async function createTemplate(input: CreateTemplateInput) {
  const res = await apiClient.post<ApiSuccessResponse<Template>>("/templates", input);
  return res.data.data;
}

export async function deleteTemplate(id: string) {
  await apiClient.delete(`/templates/${id}`);
}

export async function duplicateTemplate(id: string) {
  const res = await apiClient.post<ApiSuccessResponse<Template>>(`/templates/${id}/duplicate`);
  return res.data.data;
}
