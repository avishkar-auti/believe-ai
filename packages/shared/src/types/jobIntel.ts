/**
 * Job Intelligence: paste a job posting URL, get back structured role/company
 * facts (rule-based extraction, no LLM) plus AI-synthesized company intel
 * (funding/tech stack/hiring trend, grounded in real public snippets — the
 * model is instructed to leave a field null rather than guess). First stage
 * of the Job Outreach pipeline (ported from HireConnect's job_intelligence_agent).
 */
export type ConfidenceLevel = "high" | "low";
export type HiringTrend = "growing" | "stable" | "contracting";

export interface CompanyIntel {
  employeeCount: number | null;
  techStack: string[];
  funding: string | null;
  hiringTrend: HiringTrend | null;
  confidence: {
    employeeCount: ConfidenceLevel;
    techStack: ConfidenceLevel;
    funding: ConfidenceLevel;
    hiringTrend: ConfidenceLevel;
  };
}

export interface JobIntel {
  id: string;
  userId: string;
  jobUrl: string;
  company: string;
  roleTitle: string;
  skills: string[];
  experienceLevel: string;
  location: string;
  hiringTeamNames: string[];
  atsKeywords: string[];
  companyIntel: CompanyIntel;
  /** "low" when neither the posting text nor the URL yielded a recognizable role/company — surfaced so the UI can flag it rather than presenting a guess as fact. */
  parsingConfidence: ConfidenceLevel;
  createdAt: string;
}
