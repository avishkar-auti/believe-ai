import type { Resume, UpdateResumeInput } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchResumes(): Promise<Resume[]> {
  const res = await apiClient.get<Resume[]>("/resumes");
  return res.data;
}

export async function fetchResume(id: string): Promise<Resume> {
  const res = await apiClient.get<Resume>(`/resumes/${id}`);
  return res.data;
}

export async function uploadResume(file: File, targetRole?: string): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<Resume>("/resumes", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    params: targetRole ? { targetRole } : undefined,
  });
  return res.data;
}

export async function updateResume(id: string, input: UpdateResumeInput): Promise<Resume> {
  const res = await apiClient.patch<Resume>(`/resumes/${id}`, input);
  return res.data;
}

export async function setPrimaryResume(id: string): Promise<Resume> {
  const res = await apiClient.patch<Resume>(`/resumes/${id}/primary`);
  return res.data;
}

export async function deleteResume(id: string): Promise<void> {
  await apiClient.delete(`/resumes/${id}`);
}

export interface ResumeChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askResume(resumeId: string, question: string, history: ResumeChatMessage[]): Promise<{ answer: string }> {
  const res = await apiClient.post<{ answer: string }>("/ai/resumes/chat", { question, history, resumeId });
  return res.data;
}
