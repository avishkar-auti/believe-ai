import { apiClient } from "../../lib/apiClient.js";

// Served directly by the Python AI service, ephemeral, same two-backend
// split as the AI Writer and "Ask My Resume" chat.

export interface TemplateChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TemplateChatResult {
  reply: string;
  subject: string;
  body: string;
}

export async function chatAboutTemplate(
  message: string,
  history: TemplateChatMessage[],
  currentSubject: string | null,
  currentBody: string | null,
): Promise<TemplateChatResult> {
  const res = await apiClient.post<TemplateChatResult>("/ai/template-chat", {
    message,
    history,
    currentSubject,
    currentBody,
  });
  return res.data;
}
