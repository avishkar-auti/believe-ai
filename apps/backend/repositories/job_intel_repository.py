"""Beanie-backed job intel access — mirrors apps/api's jobIntel.repository.ts."""

from __future__ import annotations

from bson import ObjectId

from models.job_intel import JobIntel
from schemas.ai import CompanyIntelResult


async def create(
    user_id: ObjectId,
    *,
    job_url: str,
    company: str,
    role_title: str,
    skills: list[str],
    experience_level: str,
    location: str,
    hiring_team_names: list[str],
    ats_keywords: list[str],
    company_intel: CompanyIntelResult,
    parsing_confidence: str,
) -> JobIntel:
    doc = JobIntel(
        userId=user_id,
        jobUrl=job_url,
        company=company,
        roleTitle=role_title,
        skills=skills,
        experienceLevel=experience_level,
        location=location,
        hiringTeamNames=hiring_team_names,
        atsKeywords=ats_keywords,
        companyIntel=company_intel,
        parsingConfidence=parsing_confidence,  # type: ignore[arg-type]
    )
    await doc.insert()
    return doc


async def list_for_user(user_id: ObjectId, page: int, limit: int) -> tuple[list[JobIntel], int]:
    skip = (page - 1) * limit
    items = await JobIntel.find(JobIntel.userId == user_id).sort("-createdAt").skip(skip).limit(limit).to_list()
    total = await JobIntel.find(JobIntel.userId == user_id).count()
    return items, total


async def find_by_id(job_intel_id: ObjectId, user_id: ObjectId) -> JobIntel | None:
    return await JobIntel.find_one(JobIntel.id == job_intel_id, JobIntel.userId == user_id)


async def delete(job_intel_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(job_intel_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True
