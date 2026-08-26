"""Step A — grounded hook selection. Deliberately makes no LLM call: every
hook here traces to a real, already-known fact — a skill the job requires
that the company's own tech stack also uses, or a high-confidence company
milestone. Mirrors apps/api's services/outreachHook.ts exactly."""

from __future__ import annotations

from dataclasses import dataclass

from models.outreach_draft import HookConfidence
from schemas.ai import CompanyIntelResult


@dataclass
class OutreachHook:
    hook: str
    confidence: HookConfidence


def compute_outreach_hook(company: str, job_skills: list[str], company_intel: CompanyIntelResult) -> OutreachHook:
    job_skills_lower = {s.lower() for s in job_skills}
    tech_overlap = next((t for t in company_intel.techStack if t.lower() in job_skills_lower), None)
    if tech_overlap:
        return OutreachHook(
            hook=f"Shared tech stack: this role's use of {tech_overlap} lines up with {company}'s stack.",
            confidence="high",
        )

    if company_intel.funding and company_intel.confidence.funding == "high":
        return OutreachHook(hook=f"Recent milestone: {company}'s {company_intel.funding} funding round.", confidence="high")

    if company_intel.hiringTrend and company_intel.confidence.hiringTrend == "high":
        return OutreachHook(hook=f"Company signal: {company} is currently {company_intel.hiringTrend}.", confidence="high")

    return OutreachHook(hook=f"No distinguishing public fact found for {company} yet.", confidence="low")


def compute_matching_skills(job_skills: list[str], resume_content: str | None) -> list[str]:
    """Skills the job requires that the candidate's own resume actually mentions — never the gaps."""
    if not resume_content:
        return []
    lowered = resume_content.lower()
    return [skill for skill in job_skills if skill.lower() in lowered]
