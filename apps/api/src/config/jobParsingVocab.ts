/**
 * Matching vocabulary for jobParsing.ts — not per-run data, this doesn't vary
 * between jobs, it's what the parser scans real posting text against. The
 * actual skills/keywords returned for a given job are always computed from
 * that run's real text; this list never becomes a fallback value.
 * Ported from HireConnect's job_intelligence_config.py.
 */

export const DEFAULT_EXPERIENCE_LEVEL = "Not specified";
export const DEFAULT_LOCATION = "Not specified";

// Ordered — first matching pattern wins (most specific seniority signals first).
export const EXPERIENCE_LEVEL_PATTERNS: [RegExp, string][] = [
  [/\bprincipal\b/i, "Principal"],
  [/\bstaff\b/i, "Staff"],
  [/\b(senior|sr\.?)\b/i, "Senior"],
  [/\blead\b/i, "Lead"],
  [/\b(junior|jr\.?)\b/i, "Junior"],
  [/\b(entry[\s-]?level|new grad(uate)?)\b/i, "Entry-level"],
  [/\b(mid[\s-]?level|intermediate)\b/i, "Mid"],
];

export const LOCATION_PATTERNS: [RegExp, string][] = [
  [/\bremote\b/i, "Remote"],
  [/\bhybrid\b/i, "Hybrid"],
  [/\bon[\s-]?site\b/i, "Onsite"],
];

export const KNOWN_SKILL_KEYWORDS = [
  "Python", "FastAPI", "Django", "Flask", "JavaScript", "TypeScript",
  "React", "Vue", "Angular", "Node.js", "Java", "Spring", "Go", "Rust",
  "C++", "C#", "Ruby", "Rails", "PHP", "PostgreSQL", "MySQL", "MongoDB",
  "Redis", "Kubernetes", "Docker", "AWS", "GCP", "Azure", "Terraform",
  "Jenkins", "CI/CD", "GraphQL", "REST APIs", "gRPC", "Kafka",
  "RabbitMQ", "Elasticsearch", "Microservices", "TDD", "Agile", "Scrum",
  "Machine Learning", "TensorFlow", "PyTorch", "SQL", "NoSQL", "Linux",
  "Git", "HTML", "CSS", "Tailwind", "Next.js", "Swift", "Kotlin",
  "Android", "iOS",
];

// ATS systems typically scan for both hard skills and common process/soft-skill phrasing.
export const ATS_KEYWORD_VOCAB = [
  ...KNOWN_SKILL_KEYWORDS,
  "cross-functional", "stakeholder management", "CI/CD pipeline", "code review", "on-call",
];

// Only fires if the posting explicitly names a team — never fabricated when absent.
export const HIRING_TEAM_NAME_PATTERNS = [
  /join(?:ing)? the ([A-Z][\w& ]{2,40}) team/gi,
  /report(?:s|ing)? to (?:the )?([A-Z][\w& ]{2,40}) team/gi,
  /(?:on|within) the ([A-Z][\w& ]{2,40}) team/gi,
];
