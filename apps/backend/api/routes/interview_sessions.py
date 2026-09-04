"""Interview Prep session history — completing a session is the only
persisted action; question generation, coaching, and per-answer feedback
stay ephemeral (see api/routes/interview.py)."""

from __future__ import annotations

from fastapi import APIRouter

from api.dependencies import MongoUserIdDep
from schemas.interview_session import CompleteInterviewSessionInput, InterviewSessionSummaryDto
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from services import interview_session_service

router = APIRouter(prefix="/interview/sessions", tags=["interview-sessions"])


@router.post("/", response_model=InterviewSessionSummaryDto, status_code=201)
async def complete_session_route(body: CompleteInterviewSessionInput, mongo_user_id: MongoUserIdDep) -> InterviewSessionSummaryDto:
    return await interview_session_service.complete_session(mongo_user_id, body)


@router.get("/", response_model=PaginatedResult[InterviewSessionSummaryDto])
async def list_sessions_route(
    mongo_user_id: MongoUserIdDep, page: int = 1, limit: int = DEFAULT_PAGE_SIZE
) -> PaginatedResult[InterviewSessionSummaryDto]:
    return await interview_session_service.list_sessions(mongo_user_id, page, limit)
