"""Career Fit: reads the caller's own stored resume (read-only, scoped by
Mongo user id) and hands the full text to the career-fit agent — the whole
resume, not a chunked excerpt, since this analysis needs the complete
picture rather than an answer to one narrow question (unlike Resume Chat,
which retrieves; this is a "read the one document" task where full context
is already the correct retrieval strategy).

Retrofit onto the shared rag/ module (Phase 6): the generated summary's
groundedness in the resume is logged — real signal for catching a synthesis
that drifted into invented specifics, not a hard gate (the heuristic is
word-overlap, not semantic, so it's better suited to flagging for review
than to silently discarding a good analysis).
"""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.career_fit_agent import analyze_career_fit
from core.config import Settings
from core.errors import NotFoundError
from core.logging import get_logger
from models.career_fit import CareerFit
from rag.grounding import grounding_overlap, is_grounded
from repositories import career_fit_repository, resumes_repository
from schemas.ai import CareerFitRequest, CareerFitResult
from schemas.career_fit import CareerFitDto
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult, safe_limit, safe_page, total_pages

logger = get_logger(__name__)


def _to_dto(doc: CareerFit) -> CareerFitDto:
    assert doc.id is not None
    return CareerFitDto(
        id=str(doc.id),
        userId=str(doc.userId),
        targetRole=doc.targetRole,
        summary=doc.summary,
        strengths=doc.strengths,
        skillGaps=doc.skillGaps,
        suggestedRoles=doc.suggestedRoles,
        fitScore=doc.fitScore,
        createdAt=doc.createdAt.isoformat(),
    )


async def analyze_career_fit_for_user(
    settings: Settings, db: AsyncIOMotorDatabase, user_id: ObjectId, target_role: str | None, resume_id: ObjectId | None = None
) -> CareerFitResult:
    resume = await resumes_repository.resolve_for_user(db, user_id, resume_id)
    if not resume:
        raise NotFoundError("No resume uploaded yet" if not resume_id else "Resume not found")

    resume_text = resume["content"]
    result = await analyze_career_fit(settings, CareerFitRequest(resumeText=resume_text, targetRole=target_role))

    if not is_grounded(result.summary, resume_text):
        logger.warning(
            "Career Fit summary for user %s scored low on the grounding check (overlap=%.2f)",
            user_id,
            grounding_overlap(result.summary, resume_text),
        )

    return result


async def generate_and_save(
    settings: Settings, db: AsyncIOMotorDatabase, user_id: ObjectId, target_role: str | None, resume_id: ObjectId | None = None
) -> CareerFitDto:
    """Mirrors apps/api's careerFit.service.ts's generate() — calls the AI
    generation above, then persists the result as its own history entry."""
    result = await analyze_career_fit_for_user(settings, db, user_id, target_role, resume_id)
    doc = await career_fit_repository.create(
        user_id, target_role, result.summary, result.strengths, result.skillGaps, result.suggestedRoles, result.fitScore
    )
    return _to_dto(doc)


async def list_career_fits(user_id: ObjectId, page: int = 1, limit: int = DEFAULT_PAGE_SIZE) -> PaginatedResult[CareerFitDto]:
    safe_page_, safe_limit_ = safe_page(page), safe_limit(limit)
    items, total = await career_fit_repository.list_for_user(user_id, safe_page_, safe_limit_)
    return PaginatedResult(
        items=[_to_dto(doc) for doc in items], page=safe_page_, limit=safe_limit_, total=total, totalPages=total_pages(total, safe_limit_)
    )


async def get_career_fit(career_fit_id: ObjectId, user_id: ObjectId) -> CareerFitDto:
    doc = await career_fit_repository.find_by_id(career_fit_id, user_id)
    if not doc:
        raise NotFoundError("Career fit assessment not found")
    return _to_dto(doc)


async def delete_career_fit(career_fit_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await career_fit_repository.delete(career_fit_id, user_id)
    if not deleted:
        raise NotFoundError("Career fit assessment not found")
