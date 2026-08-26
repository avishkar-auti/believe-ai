import { apiClient } from "../../lib/apiClient.js";

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

export async function generateInterviewQuestions(targetRole?: string) {
  const res = await apiClient.post<{ questions: InterviewQuestion[] }>("/interview/questions", { targetRole });
  return res.data.questions;
}

export async function askInterviewCoach(message: string, history: InterviewCoachMessage[]) {
  const res = await apiClient.post<{ reply: string }>("/interview/coach", { message, history });
  return res.data.reply;
}

export async function runCode(language: SandboxLanguage, sourceCode: string, stdin: string) {
  const res = await apiClient.post<RunCodeResult>("/code/run", { language, sourceCode, stdin });
  return res.data;
}
