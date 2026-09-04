import type {
  ChallengeDetail,
  ChallengeDifficulty,
  ChallengeStatus,
  ChallengeSummary,
  ChallengeTrack,
  ChallengeType,
  ExecutionResult,
  PaginatedResult,
  PracticeProgress,
  Submission,
} from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export interface ChallengeFilters {
  q?: string;
  track?: ChallengeTrack;
  difficulty?: ChallengeDifficulty;
  challengeType?: ChallengeType;
  status?: ChallengeStatus;
  page?: number;
}

export async function fetchChallenges(filters: ChallengeFilters = {}) {
  const res = await apiClient.get<PaginatedResult<ChallengeSummary>>("/practice/challenges", { params: filters });
  return res.data;
}

export async function fetchChallengeBySlug(slug: string) {
  const res = await apiClient.get<ChallengeDetail>(`/practice/challenges/${slug}`);
  return res.data;
}

export async function runChallenge(slug: string, files: Record<string, string>) {
  const res = await apiClient.post<ExecutionResult>(`/practice/challenges/${slug}/run`, { files });
  return res.data;
}

export async function evaluateChallenge(slug: string, files: Record<string, string>) {
  const res = await apiClient.post<ExecutionResult>(`/practice/challenges/${slug}/evaluate`, { files });
  return res.data;
}

export async function submitChallenge(challengeId: string, files: Record<string, string>) {
  const res = await apiClient.post<Submission>("/practice/submissions", { challengeId, files });
  return res.data;
}

export async function fetchSubmissionHistory(challengeId?: string, page = 1) {
  const res = await apiClient.get<PaginatedResult<Submission>>("/practice/submissions", { params: { challengeId, page } });
  return res.data;
}

export async function fetchSubmission(id: string) {
  const res = await apiClient.get<Submission>(`/practice/submissions/${id}`);
  return res.data;
}

export async function fetchPracticeProgress() {
  const res = await apiClient.get<PracticeProgress>("/practice/progress");
  return res.data;
}
