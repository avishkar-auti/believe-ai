import type { CompanyIntel, HookConfidence } from "@believe-ai/shared";

/**
 * Step A — grounded hook selection. Deliberately makes no LLM call: every
 * hook here traces to a real, already-known fact — a skill the job requires
 * that the company's own tech stack also uses, or a high-confidence company
 * milestone. Ported from HireConnect's personalization_logic.py, adapted:
 * warm-path hooks (from a discovered contact's shared alma mater / prior
 * company) are deferred to Phase 3 (lead_discovery) since no contact
 * discovery exists yet — every hook in this phase is job/company-grounded,
 * not contact-specific, and so is currently the same across contacts in one
 * generation batch. That's an honest consequence of not having per-contact
 * signals yet, not a bug.
 */
export interface OutreachHook {
  hook: string;
  confidence: HookConfidence;
}

export function computeOutreachHook(company: string, jobSkills: string[], companyIntel: CompanyIntel): OutreachHook {
  const jobSkillsLower = new Set(jobSkills.map((s) => s.toLowerCase()));
  const techOverlap = companyIntel.techStack.find((t) => jobSkillsLower.has(t.toLowerCase()));
  if (techOverlap) {
    return {
      hook: `Shared tech stack: this role's use of ${techOverlap} lines up with ${company}'s stack.`,
      confidence: "high",
    };
  }

  if (companyIntel.funding && companyIntel.confidence.funding === "high") {
    return { hook: `Recent milestone: ${company}'s ${companyIntel.funding} funding round.`, confidence: "high" };
  }

  if (companyIntel.hiringTrend && companyIntel.confidence.hiringTrend === "high") {
    return { hook: `Company signal: ${company} is currently ${companyIntel.hiringTrend}.`, confidence: "high" };
  }

  return { hook: `No distinguishing public fact found for ${company} yet.`, confidence: "low" };
}

/** Skills the job requires that the candidate's own resume actually mentions — never the gaps. */
export function computeMatchingSkills(jobSkills: string[], resumeContent: string | null): string[] {
  if (!resumeContent) return [];
  const lowered = resumeContent.toLowerCase();
  return jobSkills.filter((skill) => lowered.includes(skill.toLowerCase()));
}
