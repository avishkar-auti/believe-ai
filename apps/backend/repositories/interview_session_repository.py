"""Beanie-backed access for completed Interview Prep sessions — a session is
created only once, when the candidate reaches the end of their question set
(see services/interview_session_service.py)."""

from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from models.interview_session import InterviewSession


async def create(
    user_id: ObjectId,
    target_role: str | None,
    interview_type: str,
    difficulty: str | None,
    total_questions: int,
    answered_count: int,
    overall_score: int | None,
    started_at: datetime,
) -> InterviewSession:
    doc = InterviewSession(
        userId=user_id,
        targetRole=target_role,
        interviewType=interview_type,
        difficulty=difficulty,
        totalQuestions=total_questions,
        answeredCount=answered_count,
        overallScore=overall_score,
        startedAt=started_at,
    )
    await doc.insert()
    return doc


async def list_for_user(user_id: ObjectId, page: int, limit: int) -> tuple[list[InterviewSession], int]:
    skip = (page - 1) * limit
    items = await InterviewSession.find(InterviewSession.userId == user_id).sort("-completedAt").skip(skip).limit(limit).to_list()
    total = await InterviewSession.find(InterviewSession.userId == user_id).count()
    return items, total
