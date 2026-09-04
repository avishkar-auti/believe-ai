/**
 * Canonical Job type. Only "internal" jobs are ever persisted — "jsearch"
 * entries are fetched live from the external API and merged into the list
 * response, never written to our own database.
 */
export type JobSource = "internal" | "jsearch";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
export type WorkMode = "remote" | "hybrid" | "onsite";
export type ExperienceLevel = "fresher" | "junior" | "mid" | "senior" | "lead";
export type DatePostedFilter = "any" | "24h" | "7d" | "30d";

export const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];
export const EXPERIENCE_LEVELS: ExperienceLevel[] = ["fresher", "junior", "mid", "senior", "lead"];

export const DATE_POSTED_OPTIONS: { value: DatePostedFilter; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "24h", label: "Past 24 hours" },
  { value: "7d", label: "Past week" },
  { value: "30d", label: "Past month" },
];

export interface Job {
  id: string;
  source: JobSource;
  /** Null for external (jsearch) listings. Internal jobs retain a postedBy
   * owner id from before recruiter self-service posting was removed from
   * the Job Board UI — no longer settable through the app. */
  postedBy: string | null;
  title: string;
  company: string;
  location: string | null;
  description: string;
  skills: string[];
  employmentType: EmploymentType | null;
  workMode: WorkMode | null;
  experienceLevel: ExperienceLevel | null;
  /** Annual compensation range. Either end may be set alone (e.g. only a floor listed). Currency-agnostic. */
  salaryMin: number | null;
  salaryMax: number | null;
  recruiterLinkedIn: string | null;
  applyUrl: string | null;
  createdAt: string;
  updatedAt: string;
  /** True if the requesting user has bookmarked this job. Only present on authenticated search results. */
  isSaved?: boolean;
}

/** One distinct parsed location, e.g. from "Chicago, Illinois, US" — best-effort split of the
 * free-text location string, since no job stores structured geo fields. */
export interface LocationOption {
  country: string | null;
  state: string | null;
  city: string | null;
}

/** Distinct facet values for populating the Job Board's filter sidebar. */
export interface JobFilterOptions {
  locations: string[];
  locationOptions: LocationOption[];
  companies: string[];
  skills: string[];
}

/**
 * Deterministic, not AI-generated (see apps/backend/services/job_match_service.py):
 * matchPercent is the real share of the job's listed skills found in the resume text,
 * never an invented similarity score. `null` means the job listed no skills to compare —
 * a different claim from "0% match" — callers should show an "Analyze fit" CTA instead.
 */
export interface JobMatch {
  matchPercent: number;
  label: "strong" | "good" | "partial";
  matchedSkills: string[];
  gapSkills: string[];
}

export interface JobMatchInput {
  job?: Job;
  resumeId?: string;
}

export interface JobSearchFilters {
  q?: string;
  country?: string;
  state?: string;
  city?: string;
  company?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  experienceLevel?: ExperienceLevel;
  skill?: string;
  source?: JobSource;
  /** Minimum salary floor — matches jobs whose range reaches at least this amount. */
  salaryMin?: number;
  datePosted?: DatePostedFilter;
  savedOnly?: boolean;
}
