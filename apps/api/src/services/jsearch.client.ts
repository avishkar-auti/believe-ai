import type { DatePostedFilter, EmploymentType, Job } from "@believe-ai/shared";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

interface JSearchJob {
  job_id: string;
  employer_name: string | null;
  job_title: string | null;
  job_description: string | null;
  job_city: string | null;
  job_state: string | null;
  job_country: string | null;
  job_apply_link: string | null;
  job_employment_type: string | null;
  job_posted_at_datetime_utc: string | null;
  job_required_skills: string[] | null;
  job_is_remote: boolean | null;
  job_min_salary: number | null;
  job_max_salary: number | null;
}

const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentType> = {
  FULLTIME: "full_time",
  PARTTIME: "part_time",
  CONTRACTOR: "contract",
  INTERN: "internship",
};

/** JSearch's own `date_posted` query values — "all" is the default when no filter is set. */
const DATE_POSTED_MAP: Record<Exclude<DatePostedFilter, "any">, string> = {
  "24h": "today",
  "7d": "week",
  "30d": "month",
};

function toJobDto(j: JSearchJob): Job {
  const now = new Date().toISOString();
  const location = [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || null;
  return {
    id: `jsearch:${j.job_id}`,
    source: "jsearch",
    postedBy: null,
    title: j.job_title ?? "Untitled role",
    company: j.employer_name ?? "Unknown company",
    location,
    description: j.job_description ?? "",
    skills: j.job_required_skills ?? [],
    employmentType: j.job_employment_type ? (EMPLOYMENT_TYPE_MAP[j.job_employment_type] ?? null) : null,
    // JSearch only tells us remote-or-not, not hybrid vs. on-site, so anything not remote is left unset.
    workMode: j.job_is_remote ? "remote" : null,
    experienceLevel: null,
    salaryMin: j.job_min_salary ?? null,
    salaryMax: j.job_max_salary ?? null,
    recruiterLinkedIn: null,
    applyUrl: j.job_apply_link,
    createdAt: j.job_posted_at_datetime_utc ?? now,
    updatedAt: j.job_posted_at_datetime_utc ?? now,
  };
}

/**
 * Best-effort external search — never throws. A slow or failing external API
 * shouldn't break the whole job board when internal listings are still
 * perfectly servable; failures are logged and the caller gets an empty list.
 */
export async function searchExternalJobs(query: string, datePosted?: DatePostedFilter): Promise<Job[]> {
  if (!env.RAPIDAPI_JSEARCH_KEY || !query) return [];

  const dateParam = datePosted && datePosted !== "any" ? DATE_POSTED_MAP[datePosted] : "all";

  try {
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1&date_posted=${dateParam}`,
      {
        headers: {
          "X-RapidAPI-Key": env.RAPIDAPI_JSEARCH_KEY,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      },
    );
    if (!res.ok) {
      logger.warn({ status: res.status }, "JSearch request failed, showing internal jobs only");
      return [];
    }
    const data = (await res.json()) as { data?: JSearchJob[] };
    return (data.data ?? []).map(toJobDto);
  } catch (err) {
    logger.warn({ err }, "JSearch request errored, showing internal jobs only");
    return [];
  }
}
