"""Learning Roadmap: reads the caller's own stored resume (read-only, scoped
by Mongo user id) and hands the full text to the roadmap agent alongside
their stated goal. A resume is optional — the roadmap still generates without
one, just without resume-aware skill status.

Retrofit onto the shared rag/ module (Phase 6): when personalized, the
detected-skills list's groundedness in the resume is logged — a skill the
model claims to have "detected" that doesn't actually appear in the resume
text is a real hallucination signal, logged for review rather than silently
dropped (the roadmap itself still generates; missing/extra skills there
would need the underlying agent prompt fixed, not a runtime filter).
"""

from __future__ import annotations

import asyncio

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.roadmap_agent import build_roadmap
from clients.youtube_client import search_youtube_videos
from core.config import Settings
from core.errors import NotFoundError
from core.logging import get_logger
from models.roadmap import Roadmap, RoadmapResource, RoadmapStage
from rag.grounding import grounding_overlap, is_grounded
from repositories import resumes_repository, roadmap_repository
from schemas.ai import RoadmapRequest, RoadmapResult
from schemas.ai import RoadmapStage as AiRoadmapStage
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult, safe_limit, safe_page, total_pages
from schemas.roadmap import RoadmapDto, RoadmapResourceDto, RoadmapStageDto
from services.documentation_resources import find_documentation

logger = get_logger(__name__)


async def build_roadmap_for_user(
    settings: Settings,
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    goal: str,
    personalize: bool = True,
    resume_id: ObjectId | None = None,
) -> RoadmapResult:
    resume_text = ""
    if personalize:
        resume = await resumes_repository.resolve_for_user(db, user_id, resume_id)
        if resume:
            resume_text = resume["content"]

    result = await build_roadmap(settings, RoadmapRequest(resumeText=resume_text, goal=goal))

    if resume_text and result.detectedSkills:
        detected = ", ".join(result.detectedSkills)
        if not is_grounded(detected, resume_text):
            logger.warning(
                "Roadmap detectedSkills for user %s scored low on the grounding check (overlap=%.2f): %s",
                user_id,
                grounding_overlap(detected, resume_text),
                detected,
            )

    return result


def _to_dto(doc: Roadmap) -> RoadmapDto:
    assert doc.id is not None
    return RoadmapDto(
        id=str(doc.id),
        userId=str(doc.userId),
        goal=doc.goal,
        detectedSkills=doc.detectedSkills,
        stages=[
            RoadmapStageDto(
                title=s.title,
                topics=s.topics,
                difficulty=s.difficulty,
                prerequisites=s.prerequisites,
                skillStatus=s.skillStatus,
                resources=[
                    RoadmapResourceDto(
                        title=r.title,
                        type=r.type,
                        url=r.url,
                        videoId=r.videoId,
                        channelName=r.channelName,
                        thumbnailUrl=r.thumbnailUrl,
                        publishedAt=r.publishedAt,
                        durationSeconds=r.durationSeconds,
                    )
                    for r in s.resources
                ],
            )
            for s in doc.stages
        ],
        createdAt=doc.createdAt.isoformat(),
    )


def _build_youtube_query(stage_title: str, goal: str, difficulty: str | None) -> str:
    """"Kubernetes for beginners DevOps" — scoped to the stage + goal + level, not the whole resume (relevance over recall)."""
    level = "for beginners" if difficulty == "beginner" else "advanced" if difficulty == "advanced" else "tutorial"
    return f"{stage_title} {level} {goal}".strip()


async def _enrich_stage(settings: Settings, stage: AiRoadmapStage, goal: str) -> list[RoadmapResource]:
    """Replaces the agent's placeholder resources with real ones: the LLM never emits a genuine
    video URL (it's told not to), so every "video" resource here comes from a real YouTube
    search. Documentation prefers our curated, hand-verified map over the LLM's own guess,
    falling back to the LLM's url only when it set one and our map has no match."""
    query = _build_youtube_query(stage.title, goal, stage.difficulty)
    own_doc = find_documentation(stage.title) or find_documentation(" ".join(stage.topics))
    videos = await search_youtube_videos(settings, query, 4)

    llm_docs_with_url = [r for r in stage.resources if r.type == "documentation" and r.url]
    other_resources = [r for r in stage.resources if r.type not in ("video", "documentation")]

    doc_resources = (
        [own_doc] if own_doc else [RoadmapResource(title=r.title, type="documentation", url=r.url) for r in llm_docs_with_url]
    )
    other = [RoadmapResource(title=r.title, type=r.type, url=r.url) for r in other_resources]

    return [*doc_resources, *videos, *other]


async def generate_and_save(
    settings: Settings,
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    goal: str,
    personalize: bool = True,
    resume_id: ObjectId | None = None,
) -> RoadmapDto:
    """Mirrors apps/api's roadmap.service.ts's generate() — calls the AI
    generation above, enriches every stage with real YouTube videos +
    documentation, then persists the result as its own history entry."""
    result = await build_roadmap_for_user(settings, db, user_id, goal, personalize, resume_id)

    enriched_stages = await asyncio.gather(*(_enrich_stage(settings, stage, result.goal) for stage in result.stages))
    stages = [
        RoadmapStage(
            title=stage.title, topics=stage.topics, difficulty=stage.difficulty, prerequisites=stage.prerequisites,
            skillStatus=stage.skillStatus, resources=resources,
        )
        for stage, resources in zip(result.stages, enriched_stages, strict=True)
    ]

    doc = await roadmap_repository.create(user_id, result.goal, result.detectedSkills, stages)
    return _to_dto(doc)


async def list_roadmaps(user_id: ObjectId, page: int = 1, limit: int = DEFAULT_PAGE_SIZE) -> PaginatedResult[RoadmapDto]:
    safe_page_, safe_limit_ = safe_page(page), safe_limit(limit)
    items, total = await roadmap_repository.list_for_user(user_id, safe_page_, safe_limit_)
    return PaginatedResult(
        items=[_to_dto(doc) for doc in items], page=safe_page_, limit=safe_limit_, total=total, totalPages=total_pages(total, safe_limit_)
    )


async def get_roadmap(roadmap_id: ObjectId, user_id: ObjectId) -> RoadmapDto:
    doc = await roadmap_repository.find_by_id(roadmap_id, user_id)
    if not doc:
        raise NotFoundError("Roadmap not found")
    return _to_dto(doc)


async def delete_roadmap(roadmap_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await roadmap_repository.delete(roadmap_id, user_id)
    if not deleted:
        raise NotFoundError("Roadmap not found")
