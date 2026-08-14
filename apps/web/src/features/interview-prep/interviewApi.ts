import type { ApiSuccessResponse } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";
import { aiServiceClient } from "../../lib/aiServiceClient.js";

export type InterviewQuestionCategory = "behavioral" | "technical" | "system_design" | "coding";

export interface InterviewQuestion {
  question: string;
  category: InterviewQuestionCategory;
}

export interface InterviewCoachMessage {
  role: "user" | "assistant";
  content: string;
}

export type SandboxLanguage = "python" | "javascript" | "java" | "cpp" | "go";

export interface RunCodeResult {
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  status: string;
  timeSeconds: number | null;
  memoryKb: number | null;
}

// Questions and coach chat are ephemeral (never persisted), so — same as
// campaign insights — the web app calls the Python AI service directly.

export async function generateInterviewQuestions(targetRole?: string) {
  const res = await aiServiceClient.post<{ questions: InterviewQuestion[] }>("/interview/questions", { targetRole });
  return res.data.questions;
}

export async function askInterviewCoach(message: string, history: InterviewCoachMessage[]) {
  const res = await aiServiceClient.post<{ reply: string }>("/interview/coach", { message, history });
  return res.data.reply;
}

// The code sandbox is a plain external proxy (not AI), so it's the Node API's job.
export async function runCode(language: SandboxLanguage, sourceCode: string, stdin: string) {
  const res = await apiClient.post<ApiSuccessResponse<RunCodeResult>>("/code/run", { language, sourceCode, stdin });
  return res.data.data;
}
