import { LinkedinLeadCacheModel } from "@believe-ai/server";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export interface LinkedinProfile {
  name: string;
  title: string | null;
  linkedinUrl: string | null;
  priorCompanies: string[];
}

// Every alias a RapidAPI LinkedIn-search product has been seen to use for the
// same logical field, tried in order — response shape varies by which
// specific product is subscribed to. Ported from HireConnect's linkedin_client.py.
const NAME_KEYS = ["fullName", "full_name", "name"];
const HEADLINE_KEYS = ["headline", "title", "position", "occupation"];
const URL_KEYS = ["profileURL", "profileUrl", "linkedinUrl", "url", "profile_url"];
const USERNAME_KEYS = ["username", "publicIdentifier", "public_identifier"];

function getFirst(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (value) return String(value);
  }
  return null;
}

function normalizeProfile(raw: Record<string, unknown>): LinkedinProfile | null {
  const name = getFirst(raw, NAME_KEYS);
  if (!name) return null;

  let url = getFirst(raw, URL_KEYS);
  if (!url) {
    const username = getFirst(raw, USERNAME_KEYS);
    url = username ? `https://www.linkedin.com/in/${username}` : null;
  }

  const experience = (raw.experience ?? raw.positions ?? []) as unknown[];
  const priorCompanies: string[] = [];
  if (Array.isArray(experience)) {
    for (const role of experience) {
      if (role && typeof role === "object") {
        const company = (role as Record<string, unknown>).companyName ?? (role as Record<string, unknown>).company;
        if (company) priorCompanies.push(String(company));
      } else if (typeof role === "string") {
        priorCompanies.push(role);
      }
    }
  }

  return { name, title: getFirst(raw, HEADLINE_KEYS), linkedinUrl: url, priorCompanies };
}

function extractList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    for (const key of ["data", "people", "results", "items"]) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as Record<string, unknown>[];
    }
  }
  return [];
}

const MAX_RESULTS = 10;
const RAPIDAPI_HOST = "linkedin-data-api.p.rapidapi.com";

/**
 * Public people-search only — no login-wall scraping, no session cookies.
 * Missing key or a failed call both degrade to an empty list (JSearch-style
 * graceful degradation): lead discovery just finds nothing rather than
 * erroring, since the rest of Job Outreach works fine without it.
 */
export async function searchLinkedinLeads(company: string, title: string): Promise<LinkedinProfile[]> {
  if (!env.RAPIDAPI_LINKEDIN_KEY) return [];

  const cacheKey = `${company.trim().toLowerCase()}::${title.trim().toLowerCase()}`;
  const cached = await LinkedinLeadCacheModel.findOne({ key: cacheKey });
  if (cached) return cached.profiles as LinkedinProfile[];

  try {
    const url = new URL(`https://${RAPIDAPI_HOST}/search-people`);
    url.searchParams.set("keywords", `${title} ${company}`);
    url.searchParams.set("start", "0");

    const res = await fetch(url, {
      headers: { "X-RapidAPI-Key": env.RAPIDAPI_LINKEDIN_KEY, "X-RapidAPI-Host": RAPIDAPI_HOST },
    });
    if (!res.ok) {
      logger.warn({ status: res.status, company, title }, "linkedinLeads: RapidAPI request failed");
      return [];
    }

    const raw = extractList(await res.json());
    const profiles = raw
      .slice(0, MAX_RESULTS)
      .map(normalizeProfile)
      .filter((p): p is LinkedinProfile => p !== null);

    await LinkedinLeadCacheModel.create({ key: cacheKey, profiles });
    return profiles;
  } catch (err) {
    logger.warn({ err, company, title }, "linkedinLeads: RapidAPI request errored");
    return [];
  }
}
