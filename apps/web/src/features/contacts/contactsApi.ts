import type { Contact, CreateContactInput, CsvImportSummary, PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchContacts(params: { search?: string; page?: number; limit?: number }) {
  const res = await apiClient.get<PaginatedResult<Contact>>("/contacts/", { params });
  return res.data;
}

export async function createContact(input: CreateContactInput) {
  const res = await apiClient.post<Contact>("/contacts/", input);
  return res.data;
}

export async function fetchContact(id: string) {
  const res = await apiClient.get<Contact>(`/contacts/${id}`);
  return res.data;
}

export async function deleteContact(id: string) {
  await apiClient.delete(`/contacts/${id}`);
}

export async function updateContact(id: string, updates: Partial<CreateContactInput>) {
  const res = await apiClient.patch<Contact>(`/contacts/${id}`, updates);
  return res.data;
}

export async function parseContactsCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<{ columns: string[]; rows: Record<string, string>[] }>(
    "/contacts/import/parse",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function importContactsCsv(rows: Record<string, string>[], mapping: Record<string, string>) {
  const res = await apiClient.post<CsvImportSummary>("/contacts/import", { rows, mapping });
  return res.data;
}
