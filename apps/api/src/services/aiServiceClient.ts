import { env } from "../config/env.js";
import { AiProviderError } from "../errors/AppError.js";

export interface EmbedTextsResult {
  vectors: (number[] | null)[];
}

export interface CareerFitAiResult {
  summary: string;
  strengths: string[];
  skillGaps: string[];
  suggestedRoles: string[];
}

export interface RoadmapAiResult {
  goal: string;
  detectedSkills: string[];
  stages: {
    title: string;
    topics: string[];
    resources: { title: string; type: string; url: string | null }[];
    difficulty: "beginner" | "intermediate" | "advanced" | null;
    prerequisites: string[];
    skillStatus: "strong" | "missing" | "improve" | null;
  }[];
}

/**
 * Calls the Python AI service's stateless embedding endpoint. Unlike the
 * worker (which has no live user session and authenticates with a shared
 * internal key), this service is always invoked from within an authenticated
 * request, so it forwards that same caller's Firebase bearer token —
 * apps/ai-service verifies it exactly as it would if the web app had called
 * it directly. Vectors come back here rather than being written by
 * apps/ai-service itself, keeping that service's no-write-path guarantee intact.
 */
export async function embedTexts(bearerToken: string, texts: string[]): Promise<EmbedTextsResult> {
  const res = await fetch(`${env.AI_SERVICE_URL}/ai/resumes/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: bearerToken,
    },
    body: JSON.stringify({ texts }),
  });

  if (!res.ok) {
    throw new AiProviderError(`AI service embedding failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as EmbedTextsResult;
}

/**
 * Career Fit and Roadmap generation both read the caller's own stored resume
 * server-side in apps/ai-service (never a resumeText the client passes in) —
 * this service just forwards the bearer token and persists whatever comes back.
 */
export async function getCareerFit(bearerToken: string, targetRole: string | null): Promise<CareerFitAiResult> {
  const res = await fetch(`${env.AI_SERVICE_URL}/career/fit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: bearerToken },
    body: JSON.stringify({ targetRole }),
  });

  if (!res.ok) {
    throw new AiProviderError(`AI service career fit failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as CareerFitAiResult;
}

export async function getRoadmap(bearerToken: string, goal: string, personalize: boolean): Promise<RoadmapAiResult> {
  const res = await fetch(`${env.AI_SERVICE_URL}/career/roadmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: bearerToken },
    body: JSON.stringify({ goal, personalize }),
  });

  if (!res.ok) {
    throw new AiProviderError(`AI service roadmap failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as RoadmapAiResult;
}

export interface CompanyIntelAiResult {
  employeeCount: number | null;
  techStack: string[];
  funding: string | null;
  hiringTrend: "growing" | "stable" | "contracting" | null;
  confidence: { employeeCount: "high" | "low"; techStack: "high" | "low"; funding: "high" | "low"; hiringTrend: "high" | "low" };
}

/** Node has already fetched the real public snippets — this only asks the AI service to
 * synthesize structured fields from them, never to search the web itself. */
export async function synthesizeCompanyIntel(
  bearerToken: string,
  company: string,
  snippets: string[],
): Promise<CompanyIntelAiResult> {
  const res = await fetch(`${env.AI_SERVICE_URL}/ai/jobs/company-intel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: bearerToken },
    body: JSON.stringify({ company, snippets }),
  });

  if (!res.ok) {
    throw new AiProviderError(`AI service company intel failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as CompanyIntelAiResult;
}

export interface OutreachDraftAiResult {
  coldEmail: string;
  linkedinNote: string;
  coverLetter: string | null;
}

export async function generateOutreachDraft(
  bearerToken: string,
  input: {
    contactName: string;
    roleTitle: string;
    company: string;
    hook: string;
    matchingSkills: string[];
    candidateName: string | null;
    includeCoverLetter: boolean;
  },
): Promise<OutreachDraftAiResult> {
  const res = await fetch(`${env.AI_SERVICE_URL}/ai/jobs/outreach-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: bearerToken },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new AiProviderError(`AI service outreach draft failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as OutreachDraftAiResult;
}
