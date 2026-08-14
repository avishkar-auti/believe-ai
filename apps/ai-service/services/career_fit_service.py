"""Career Fit: reads the caller's own stored resume (read-only, scoped by
Mongo user id) and hands the full text to the career-fit agent."""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.career_fit_agent import analyze_career_fit
from core.config import Settings
from core.errors import NotFoundError
from repositories import resumes_repository
from schemas.ai import CareerFitRequest, CareerFitResult


async def analyze_career_fit_for_user(
    settings: Settings, db: AsyncIOMotorDatabase, user_id: ObjectId, target_role: str | None
) -> CareerFitResult:
    resume = await resumes_repository.find_by_user_id(db, user_id)
    if not resume:
        raise NotFoundError("No resume uploaded yet")

    return await analyze_career_fit(settings, CareerFitRequest(resumeText=resume["content"], targetRole=target_role))
