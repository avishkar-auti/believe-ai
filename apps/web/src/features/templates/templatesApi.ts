import type { CreateTemplateInput, Template, TemplatePreviewInput, TemplatePreviewResult, UpdateTemplateInput } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchTemplates() {
  const res = await apiClient.get<Template[]>("/templates/");
  return res.data;
}

/** Plain literal {{variable}} substitution — never mutates the saved
 * template. Unknown/missing keys render blank server-side (see
 * services/template_service.py), not an error. */
export async function previewTemplate(input: TemplatePreviewInput) {
  const res = await apiClient.post<TemplatePreviewResult>("/templates/preview", input);
  return res.data;
}

export async function createTemplate(input: CreateTemplateInput) {
  const res = await apiClient.post<Template>("/templates/", input);
  return res.data;
}

export async function updateTemplate(id: string, input: UpdateTemplateInput) {
  const res = await apiClient.patch<Template>(`/templates/${id}`, input);
  return res.data;
}

export async function deleteTemplate(id: string) {
  await apiClient.delete(`/templates/${id}`);
}

export async function duplicateTemplate(id: string) {
  const res = await apiClient.post<Template>(`/templates/${id}/duplicate`);
  return res.data;
}
