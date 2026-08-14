/**
 * Canonical Job type. Only "internal" (recruiter-posted) jobs are ever
 * persisted — "jsearch" entries are fetched live from the external API and
 * merged into the list response, never written to our own database.
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
  /** Null for external (jsearch) listings — only internal postings have an owner. */
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

/** Distinct facet values for populating the Job Board's filter sidebar. */
export interface JobFilterOptions {
  locations: string[];
  companies: string[];
  skills: string[];
}

export interface JobSearchFilters {
  q?: string;
  location?: string;
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
