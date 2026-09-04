import type { Certification, CreateCertificationInput, UpdateCertificationInput } from "@believe-ai/shared";
import { apiClient } from "../../../lib/apiClient.js";

export async function fetchCertifications() {
  const res = await apiClient.get<Certification[]>("/profile/certifications/");
  return res.data;
}

export async function createCertification(input: CreateCertificationInput) {
  const res = await apiClient.post<Certification>("/profile/certifications/", input);
  return res.data;
}

export async function updateCertification(id: string, input: UpdateCertificationInput) {
  const res = await apiClient.patch<Certification>(`/profile/certifications/${id}`, input);
  return res.data;
}

export async function deleteCertification(id: string) {
  await apiClient.delete(`/profile/certifications/${id}`);
}

export async function reorderCertifications(orderedIds: string[]) {
  const res = await apiClient.patch<Certification[]>("/profile/certifications/reorder", { orderedIds });
  return res.data;
}
