"""Job Board match scoring — deterministic, free, no LLM/embedding call. A
job's own listed skills are checked for a case-insensitive substring match
against the resume's raw text, so the resulting percentage is a real,
explainable count rather than an invented "AI similarity" number.

Returns None when a job lists no skills to compare against (common for
external JSearch results, which often don't populate job_required_skills) —
that's a different, honest claim ("nothing to compare") from "you match
nothing," so the caller shows an "Analyze fit" CTA instead of a score."""

from __future__ import annotations

from typing import Literal

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.errors import NotFoundError
from repositories import resumes_repository
from schemas.job import JobDto, JobMatchResult

_STRONG_THRESHOLD = 75
_GOOD_THRESHOLD = 40


def score_job_match(job_skills: list[str], resume_text: str) -> JobMatchResult | None:
    # De-duplicate case-insensitively (first-seen casing wins) so a listing
    # that accidentally repeats a skill can't inflate its own match percent.
    seen: set[str] = set()
    skills: list[str] = []
    for s in job_skills:
        cleaned = s.strip()
        if cleaned and cleaned.lower() not in seen:
            seen.add(cleaned.lower())
            skills.append(cleaned)
    if not skills:
        return None

    haystack = resume_text.lower()
    matched = [s for s in skills if s.lower() in haystack]
    gaps = [s for s in skills if s not in matched]
    percent = round(len(matched) / len(skills) * 100)
    label: Literal["strong", "good", "partial"] = (
        "strong" if percent >= _STRONG_THRESHOLD else "good" if percent >= _GOOD_THRESHOLD else "partial"
    )
    return JobMatchResult(matchPercent=percent, label=label, matchedSkills=matched, gapSkills=gaps)


async def score_job_match_for_user(
    db: AsyncIOMotorDatabase, user_id: ObjectId, job: JobDto, resume_id: ObjectId | None
) -> JobMatchResult | None:
    resume = await resumes_repository.resolve_for_user(db, user_id, resume_id)
    if not resume:
        raise NotFoundError("No resume uploaded yet" if not resume_id else "Resume not found")
    return score_job_match(job.skills, resume["content"])
