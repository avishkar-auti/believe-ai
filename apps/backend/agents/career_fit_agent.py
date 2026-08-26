"""Assesses a resume's fit against the job market (or a specific target role)."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import CareerFitRequest, CareerFitResult, SkillExtractionRequest, SkillExtractionResult


async def analyze_career_fit(settings: Settings, req: CareerFitRequest) -> CareerFitResult:
    return await with_fallback(settings, "analyze_career_fit", lambda p: p.analyze_career_fit(req))


async def extract_resume_skills(settings: Settings, req: SkillExtractionRequest) -> SkillExtractionResult:
    """Career Fit's skill-identification step on its own — narrow enough to be
    a real subroutine other agents can call instead of writing their own
    resume-skills prompt. First caller outside Career Fit itself:
    agents/news_search/generate_relevance.py, for resume-mode relevance
    reasoning grounded in the reader's actual skills."""
    return await with_fallback(settings, "extract_resume_skills", lambda p: p.extract_resume_skills(req))
