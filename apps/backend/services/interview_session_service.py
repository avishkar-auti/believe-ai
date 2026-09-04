"""Interview Prep session history — persists a completed session's summary
(see models/interview_session.py) and lists past sessions for the workspace
sidebar. Question generation, coaching, and per-answer feedback all stay
ephemeral (services/interview_service.py); this is the one persisted record."""

from __future__ import annotations

from bson import ObjectId

from models.interview_session import InterviewSession
from repositories import interview_session_repository
from schemas.interview_session import CompleteInterviewSessionInput, InterviewSessionSummaryDto
from schemas.pagination import PaginatedResult, safe_limit, safe_page, total_pages


def _to_summary_dto(doc: InterviewSession) -> InterviewSessionSummaryDto:
    return InterviewSessionSummaryDto(
        id=str(doc.id),
        targetRole=doc.targetRole,
        interviewType=doc.interviewType,
        difficulty=doc.difficulty,
        totalQuestions=doc.totalQuestions,
        answeredCount=doc.answeredCount,
        overallScore=doc.overallScore,
        startedAt=doc.startedAt.isoformat(),
        completedAt=doc.completedAt.isoformat(),
    )


async def complete_session(user_id: ObjectId, data: CompleteInterviewSessionInput) -> InterviewSessionSummaryDto:
    # Clamp defensively rather than reject — this is the caller's own private
    # history, so a malformed score just gets a sane bound, not a 422.
    scores = [max(0, min(100, s)) for s in data.answerScores]
    overall_score = round(sum(scores) / len(scores)) if scores else None
    doc = await interview_session_repository.create(
        user_id, data.targetRole, data.interviewType, data.difficulty, data.totalQuestions, len(scores), overall_score, data.startedAt
    )
    return _to_summary_dto(doc)


async def list_sessions(user_id: ObjectId, page: int, limit: int) -> PaginatedResult[InterviewSessionSummaryDto]:
    safe_page_ = safe_page(page)
    safe_limit_ = safe_limit(limit)
    docs, total = await interview_session_repository.list_for_user(user_id, safe_page_, safe_limit_)
    return PaginatedResult[InterviewSessionSummaryDto](
        items=[_to_summary_dto(d) for d in docs],
        page=safe_page_,
        limit=safe_limit_,
        total=total,
        totalPages=total_pages(total, safe_limit_),
    )
