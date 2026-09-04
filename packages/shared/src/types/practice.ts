/**
 * Canonical AI Practice Lab types. Execution engine varies per challenge:
 * "judge0" runs real, isolated single-file Python (eligible challenges
 * only, and only when the server has a Judge0/RapidAPI key configured);
 * everything else runs behind "mock" (`executed: false`, every outcome
 * "not_run"). Always read `executed`/`engine`/`message` off the actual
 * response rather than assuming — the same challenge can be real in one
 * environment and mocked in another depending on server configuration.
 */
export type ChallengeTrack = "python-for-ai" | "rag" | "agents";
export type ChallengeDifficulty = "beginner" | "intermediate" | "advanced";
export type ChallengeType = "coding" | "debugging" | "system-design" | "prompt-engineering";
/** Resolved per-user, not stored on the challenge. "solved" only applies to
 * challenges that actually ran for real (engine: "judge0") with every test
 * passing — a challenge that only ever ran behind the mock engine can be
 * "attempted" but never "solved". */
export type ChallengeStatus = "unsolved" | "attempted" | "solved";
export type TestOutcome = "passed" | "failed" | "not_run";
export type ExecutionEngine = "mock" | "judge0";

export interface ChallengeStarterFile {
  path: string;
  content: string;
  readOnly: boolean;
}

export interface SampleTest {
  name: string;
  input: string | null;
  expectedOutput: string | null;
}

export interface ChallengeResource {
  title: string;
  url: string;
}

export interface ChallengeSummary {
  id: string;
  slug: string;
  title: string;
  track: ChallengeTrack;
  difficulty: ChallengeDifficulty;
  challengeType: ChallengeType;
  summary: string;
  tags: string[];
  estimatedMinutes: number | null;
  status: ChallengeStatus;
}

export interface ChallengeDetail extends ChallengeSummary {
  description: string;
  starterFiles: ChallengeStarterFile[];
  sampleTests: SampleTest[];
  resources: ChallengeResource[];
}

export interface SubmissionTestResult {
  testCaseId: string;
  name: string;
  hidden: boolean;
  outcome: TestOutcome;
}

/** Response shape for the stateless Run/Evaluate preview actions — neither
 * one persists anything, so there's no id/createdAt. */
export interface ExecutionResult {
  engine: ExecutionEngine;
  executed: boolean;
  stdout: string | null;
  stderr: string | null;
  testResults: SubmissionTestResult[];
  totalCount: number;
  message: string;
}

/** A persisted Submission — created only by the Submit action. */
export interface Submission {
  id: string;
  challengeId: string;
  files: Record<string, string>;
  language: string;
  engine: ExecutionEngine;
  executed: boolean;
  stdout: string | null;
  stderr: string | null;
  testResults: SubmissionTestResult[];
  totalCount: number;
  /** True only for a real, fully-passing submission — see ChallengeStatus. */
  solved: boolean;
  message: string;
  createdAt: string;
}

export interface ChallengeAttempt {
  challengeId: string;
  submissionCount: number;
  lastSubmittedAt: string;
  solved: boolean;
}

export interface PracticeProgress {
  challengesAttempted: number;
  challengesSolved: number;
  totalSubmissions: number;
  attempts: ChallengeAttempt[];
  lastActivityAt: string | null;
}
