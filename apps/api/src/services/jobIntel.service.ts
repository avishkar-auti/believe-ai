import type { HydratedDocument } from "mongoose";
import type { CompanyIntel, JobIntel, PaginatedResult } from "@believe-ai/shared";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@believe-ai/shared";
import type { JobIntelDocument } from "@believe-ai/server";
import { jobIntelRepository } from "../repositories/jobIntel.repository.js";
import { fetchJobPostingText } from "./jobPostingFetch.client.js";
import { parseJobPosting } from "./jobParsing.js";
import { fetchCompanySnippets } from "./companySnippets.client.js";
import { synthesizeCompanyIntel } from "./aiServiceClient.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";

// Below this, no fetch path got anything resembling a posting — an unreachable/blocked page
// yields "", and a client-rendered shell yields just its <title> (14-60 chars observed).
const MIN_USABLE_POSTING_CHARS = 80;

function toDto(doc: HydratedDocument<JobIntelDocument>): JobIntel {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    jobUrl: doc.jobUrl,
    company: doc.company,
    roleTitle: doc.roleTitle,
    skills: doc.skills ?? [],
    experienceLevel: doc.experienceLevel,
    location: doc.location,
    hiringTeamNames: doc.hiringTeamNames ?? [],
    atsKeywords: doc.atsKeywords ?? [],
    companyIntel: doc.companyIntel as CompanyIntel,
    parsingConfidence: doc.parsingConfidence as "high" | "low",
    createdAt: doc.createdAt.toISOString(),
  };
}

export const jobIntelService = {
  toDto,

  /**
   * Step A (rule-based parsing, no LLM) then Step B (AI-synthesized company
   * intel, grounded in real public snippets Node fetches itself). Mirrors
   * HireConnect's job_intelligence_agent, adapted so every external HTTP
   * call and every DB write stays in Node — apps/ai-service only ever does
   * the one LLM synthesis step.
   */
  async analyze(userId: string, bearerToken: string, jobUrl: string): Promise<JobIntel> {
    // UnsafeJobUrlError (a ValidationError) propagates as-is — already a specific,
    // user-facing message ("that's a private address", "missing http://").
    const rawText = await fetchJobPostingText(jobUrl);

    if (rawText.trim().length < MIN_USABLE_POSTING_CHARS) {
      throw new ValidationError(
        "We couldn't read a job description at that link. It may require a login, have expired, " +
          "or be behind a bot check. Try the posting's direct URL, or paste a different link.",
      );
    }

    const parsed = parseJobPosting(rawText, jobUrl);

    const snippets = await fetchCompanySnippets(parsed.company);
    let companyIntel: CompanyIntel;
    if (snippets.length === 0) {
      companyIntel = {
        employeeCount: null,
        techStack: [],
        funding: null,
        hiringTrend: null,
        confidence: { employeeCount: "low", techStack: "low", funding: "low", hiringTrend: "low" },
      };
    } else {
      const synthesized = await synthesizeCompanyIntel(bearerToken, parsed.company, snippets);
      // Confidence is recomputed here rather than trusted blindly: a field the model
      // claimed "high" confidence for but left null is self-contradictory.
      const fields = ["employeeCount", "techStack", "funding", "hiringTrend"] as const;
      const confidence = {} as CompanyIntel["confidence"];
      for (const field of fields) {
        const value = synthesized[field];
        const isPresent = field === "techStack" ? Array.isArray(value) && value.length > 0 : value != null;
        confidence[field] = synthesized.confidence[field] === "high" && isPresent ? "high" : "low";
      }
      companyIntel = {
        employeeCount: synthesized.employeeCount,
        techStack: synthesized.techStack,
        funding: synthesized.funding,
        hiringTrend: synthesized.hiringTrend,
        confidence,
      };
    }

    const doc = await jobIntelRepository.create({
      userId,
      jobUrl,
      company: parsed.company,
      roleTitle: parsed.roleTitle,
      skills: parsed.skills,
      experienceLevel: parsed.experienceLevel,
      location: parsed.location,
      hiringTeamNames: parsed.hiringTeamNames,
      atsKeywords: parsed.atsKeywords,
      companyIntel,
      parsingConfidence: parsed.parsingConfidence,
    });
    return toDto(doc);
  },

  async list(userId: string, page = 1, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<JobIntel>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));
    const [items, total] = await jobIntelRepository.list(userId, safePage, safeLimit);
    return {
      items: items.map(toDto),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  },

  async getById(id: string, userId: string): Promise<JobIntel> {
    const doc = await jobIntelRepository.findById(id, userId);
    if (!doc) throw new NotFoundError("Job analysis not found");
    return toDto(doc);
  },

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await jobIntelRepository.delete(id, userId);
    if (!deleted) throw new NotFoundError("Job analysis not found");
  },
};
