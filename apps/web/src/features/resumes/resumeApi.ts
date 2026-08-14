import type { ApiSuccessResponse, Resume } from "@believe-ai/shared";
import { apiClient, ApiError } from "../../lib/apiClient.js";
import { aiServiceClient } from "../../lib/aiServiceClient.js";

// Upload/get/delete are the Node API's job (it owns the write path and the
// stored file). Chat is served directly by the Python AI service, same
// two-backend split as the AI Writer feature.

export async function fetchResume(): Promise<Resume | null> {
  try {
    const res = await apiClient.get<ApiSuccessResponse<Resume>>("/resumes");
    return res.data.data;
  } catch (err) {
    if (err instanceof ApiError && err.code === "NOT_FOUND") return null;
    throw err;
  }
}

export async function uploadResume(file: File): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<ApiSuccessResponse<Resume>>("/resumes", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function deleteResume(): Promise<void> {
  await apiClient.delete("/resumes");
}

export interface ResumeChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askResume(question: string, history: ResumeChatMessage[]): Promise<{ answer: string }> {
  const res = await aiServiceClient.post<{ answer: string }>("/ai/resumes/chat", { question, history });
  return res.data;
}
