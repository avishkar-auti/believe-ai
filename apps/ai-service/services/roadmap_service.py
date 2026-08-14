"""Learning Roadmap: reads the caller's own stored resume (read-only, scoped
by Mongo user id) and hands the full text to the roadmap agent alongside
their stated goal. A resume is optional — the roadmap still generates without
one, just without resume-aware skill status."""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.roadmap_agent import build_roadmap
from core.config import Settings
from repositories import resumes_repository
from schemas.ai import RoadmapRequest, RoadmapResult


async def build_roadmap_for_user(
    settings: Settings, db: AsyncIOMotorDatabase, user_id: ObjectId, goal: str, personalize: bool = True
) -> RoadmapResult:
    resume_text = ""
    if personalize:
        resume = await resumes_repository.find_by_user_id(db, user_id)
        if resume:
            resume_text = resume["content"]

    return await build_roadmap(settings, RoadmapRequest(resumeText=resume_text, goal=goal))
