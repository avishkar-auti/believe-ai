import type { PaginatedResult } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export type InterviewQuestionCategory = "behavioral" | "technical" | "system_design" | "coding";
export type InterviewType = "technical" | "behavioral" | "system_design" | "coding" | "mixed";
export type InterviewDifficulty = "easy" | "medium" | "hard";

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

/** A real, LLM-scored rubric for one answer — every number here reflects an
 * actual model judgment grounded in the resume and the question, never
 * client-side math or a placeholder. See services/interview_service.py. */
export interface InterviewAnswerFeedback {
  overallScore: number;
  technicalAccuracy: number;
  clarity: number;
  depth: number;
  communication: number;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
}

export async function generateInterviewQuestions(
  targetRole?: string,
  resumeId?: string,
  interviewType?: InterviewType,
  difficulty?: InterviewDifficulty,
  jobTitle?: string,
  jobCompany?: string,
  jobDescription?: string,
) {
  const res = await apiClient.post<{ questions: InterviewQuestion[] }>("/interview/questions", {
    targetRole,
    resumeId,
    interviewType,
    difficulty,
    jobTitle,
    jobCompany,
    jobDescription,
  });
  return res.data.questions;
}

export async function askInterviewCoach(message: string, history: InterviewCoachMessage[], resumeId?: string) {
  const res = await apiClient.post<{ reply: string }>("/interview/coach", { message, history, resumeId });
  return res.data.reply;
}

export async function getAnswerFeedback(
  question: string,
  category: InterviewQuestionCategory,
  answer: string,
  targetRole?: string,
  resumeId?: string,
) {
  const res = await apiClient.post<InterviewAnswerFeedback>("/interview/answer", {
    question,
    category,
    answer,
    targetRole,
    resumeId,
  });
  return res.data;
}

export async function runCode(language: SandboxLanguage, sourceCode: string, stdin: string) {
  const res = await apiClient.post<RunCodeResult>("/code/run", { language, sourceCode, stdin });
  return res.data;
}

/** A completed session's summary — no question/answer text, only the
 * aggregate score the backend computed from real per-answer scores. See
 * models/interview_session.py. */
export interface InterviewSessionSummary {
  id: string;
  targetRole: string | null;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty | null;
  totalQuestions: number;
  answeredCount: number;
  overallScore: number | null;
  startedAt: string;
  completedAt: string;
}

export async function completeInterviewSession(input: {
  targetRole?: string;
  interviewType: InterviewType;
  difficulty?: InterviewDifficulty;
  totalQuestions: number;
  answerScores: number[];
  startedAt: string;
}) {
  const res = await apiClient.post<InterviewSessionSummary>("/interview/sessions", input);
  return res.data;
}

export async function fetchInterviewSessions(page = 1, limit = 5) {
  const res = await apiClient.get<PaginatedResult<InterviewSessionSummary>>("/interview/sessions", { params: { page, limit } });
  return res.data;
}
