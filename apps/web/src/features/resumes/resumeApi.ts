import type { Resume } from "@believe-ai/shared";
import { apiClient, ApiError } from "../../lib/apiClient.js";

export async function fetchResume(): Promise<Resume | null> {
  try {
    const res = await apiClient.get<Resume>("/resumes");
    return res.data;
  } catch (err) {
    if (err instanceof ApiError && err.code === "NOT_FOUND") return null;
    throw err;
  }
}

export async function uploadResume(file: File): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<Resume>("/resumes", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteResume(): Promise<void> {
  await apiClient.delete("/resumes");
}

export interface ResumeChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askResume(question: string, history: ResumeChatMessage[]): Promise<{ answer: string }> {
  const res = await apiClient.post<{ answer: string }>("/ai/resumes/chat", { question, history });
  return res.data;
}
