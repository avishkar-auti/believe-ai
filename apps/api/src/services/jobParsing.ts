/**
 * Pure rule-based extraction (regex/keyword scan) over raw job posting
 * text — no LLM call. A field that can't be confidently found returns an
 * honest default ("Not specified" / empty list), never a fabricated
 * stand-in value. Ported from HireConnect's job_parsing_logic.py.
 */
import {
  ATS_KEYWORD_VOCAB,
  DEFAULT_EXPERIENCE_LEVEL,
  DEFAULT_LOCATION,
  EXPERIENCE_LEVEL_PATTERNS,
  HIRING_TEAM_NAME_PATTERNS,
  KNOWN_SKILL_KEYWORDS,
  LOCATION_PATTERNS,
} from "../config/jobParsingVocab.js";

export interface ParsedJobPosting {
  roleTitle: string;
  company: string;
  skills: string[];
  experienceLevel: string;
  location: string;
  hiringTeamNames: string[];
  atsKeywords: string[];
  parsingConfidence: "high" | "low";
}

// Company group is non-greedy, stops at a sentence boundary — without that lookahead it
// swallows past "CloudTech." into the next sentence.
const ROLE_AT_COMPANY_RE = /^\s*([^.\n]{3,80}?)\s+at\s+([A-Z][\w&' -]{1,60}?)(?=[.,\n]|$)/;

// 2-8 consecutive ALL-CAPS words — many career sites render the title in caps.
const ALL_CAPS_PHRASE_RE = /\b([A-Z][A-Z]+(?:\s+[A-Z][A-Z]+){1,7})\b/;

const WORKDAY_HOST_RE = /^([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com$/i;
const GREENHOUSE_HOST_RE = /^(?:job-)?boards\.greenhouse\.io$/i;
const LEVER_HOST_RE = /^jobs\.lever\.co$/i;

const JOB_BOARD_HOSTS = new Set([
  "linkedin.com", "www.linkedin.com",
  "indeed.com", "www.indeed.com",
  "glassdoor.com", "www.glassdoor.com",
  "ziprecruiter.com", "www.ziprecruiter.com",
  "monster.com", "www.monster.com",
]);
const GENERIC_SUBDOMAIN_PREFIXES = new Set([
  "www", "careers", "career", "jobs", "job", "apply", "recruiting", "recruitment",
  "search", "search-jobs", "talent", "hiring", "workwith", "join", "emea", "us", "uk",
]);

function slugToName(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

function isTldLike(candidate: string, labelsLeft: number): boolean {
  return labelsLeft === 1 && (candidate.length <= 3 || ["com", "net", "org", "info"].includes(candidate));
}

/** Several major ATS platforms encode the employer directly in the URL — Workday's tenant
 * subdomain, Greenhouse/Lever's first path segment. Job boards are explicitly excluded. */
function companyFromUrl(jobUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(jobUrl);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  if (JOB_BOARD_HOSTS.has(host)) return null;

  const workdayMatch = WORKDAY_HOST_RE.exec(host);
  if (workdayMatch) return slugToName(workdayMatch[1]!);

  const pathSegments = parsed.pathname.split("/").filter(Boolean);
  if ((GREENHOUSE_HOST_RE.test(host) || LEVER_HOST_RE.test(host)) && pathSegments.length > 0) {
    return slugToName(pathSegments[0]!);
  }

  // Strips generic prefixes repeatedly — real hosts stack them ("search.jobs.barclays").
  let labels = host.split(".").filter(Boolean);
  while (labels.length > 1 && GENERIC_SUBDOMAIN_PREFIXES.has(labels[0]!)) {
    labels = labels.slice(1);
  }
  if (labels.length > 0) {
    const candidate = labels[0]!;
    if (!GENERIC_SUBDOMAIN_PREFIXES.has(candidate) && !isTldLike(candidate, labels.length)) {
      return slugToName(candidate);
    }
  }
  return null;
}

function extractRoleAndCompany(rawText: string): { roleTitle: string | null; company: string | null } {
  const match = ROLE_AT_COMPANY_RE.exec(rawText);
  if (!match) return { roleTitle: null, company: null };
  const roleTitle = match[1]!.trim();
  const company = match[2]!.trim().replace(/[.,]+$/, "");
  return { roleTitle: roleTitle || null, company: company || null };
}

const TITLE_SEPARATOR_RE = /\s+[|•·–—]\s+|\s+-\s+|\s+@\s+/;
const COMPANY_TITLE_NOISE_RE = /\b(careers?|jobs?|job\s+search|hiring|vacancies|openings|apply|home)\b/gi;

function cleanCompanyFragment(fragment: string): string | null {
  const cleaned = fragment
    .replace(COMPANY_TITLE_NOISE_RE, "")
    .replace(/^[\s|\-–—·•,.]+|[\s|\-–—·•,.]+$/g, "")
    .replace(/\s{2,}/g, " ");
  return cleaned || null;
}

/** Splits the role off a page <title> like "Data Engineer | Barclays" — only when the
 * right-hand fragment is corroborated by the company the URL already independently yielded. */
function roleFromTitleLine(rawText: string, urlCompany: string | null): string | null {
  if (!urlCompany) return null;
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const title = lines[0]!;
  if (title.length > 160) return null;

  const parts = title.split(TITLE_SEPARATOR_RE).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const tail = cleanCompanyFragment(parts[parts.length - 1]!);
  if (!tail || tail.toLowerCase() !== urlCompany.toLowerCase()) return null;

  const role = parts[0]!.trim();
  COMPANY_TITLE_NOISE_RE.lastIndex = 0;
  if (new RegExp(`^(?:${COMPANY_TITLE_NOISE_RE.source})$`, "i").test(role)) return null;
  return role.length >= 3 && role.length <= 100 ? role : null;
}

function fallbackRoleTitle(rawText: string): string | null {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const first = lines[0]!;
  return first.length >= 3 && first.length <= 100 ? first : null;
}

function fallbackRoleTitleFromCaps(rawText: string): string | null {
  const match = ALL_CAPS_PHRASE_RE.exec(rawText);
  if (!match) return null;
  const phrase = match[1]!.trim();
  if (phrase.length < 6 || phrase.length > 80) return null;
  return phrase.replace(/\w\S*/g, (w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase());
}

function matchVocabulary(rawText: string, vocabulary: string[]): string[] {
  const lowered = rawText.toLowerCase();
  return vocabulary.filter((term) => lowered.includes(term.toLowerCase()));
}

function matchFirstPattern(rawText: string, patterns: [RegExp, string][], fallback: string): string {
  for (const [pattern, label] of patterns) {
    if (pattern.test(rawText)) return label;
  }
  return fallback;
}

function extractHiringTeamNames(rawText: string): string[] {
  const names: string[] = [];
  for (const pattern of HIRING_TEAM_NAME_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(rawText))) {
      const name = match[1]!.trim();
      if (name && !names.includes(name)) names.push(name);
    }
  }
  return names;
}

export function parseJobPosting(rawText: string, jobUrl = ""): ParsedJobPosting {
  const text = rawText || "";
  const urlCompany = jobUrl ? companyFromUrl(jobUrl) : null;

  let { roleTitle, company } = extractRoleAndCompany(text);
  if (!roleTitle) roleTitle = roleFromTitleLine(text, urlCompany);
  if (!roleTitle) roleTitle = fallbackRoleTitle(text);
  if (!roleTitle) roleTitle = fallbackRoleTitleFromCaps(text);
  if (!company) company = urlCompany;

  const skills = matchVocabulary(text, KNOWN_SKILL_KEYWORDS);
  const atsKeywords = matchVocabulary(text, ATS_KEYWORD_VOCAB);
  const experienceLevel = matchFirstPattern(text, EXPERIENCE_LEVEL_PATTERNS, DEFAULT_EXPERIENCE_LEVEL);
  const location = matchFirstPattern(text, LOCATION_PATTERNS, DEFAULT_LOCATION);
  const hiringTeamNames = extractHiringTeamNames(text);

  return {
    roleTitle: roleTitle || "Not specified",
    company: company || "Not specified",
    skills,
    experienceLevel,
    location,
    hiringTeamNames,
    atsKeywords,
    parsingConfidence: roleTitle && company ? "high" : "low",
  };
}
