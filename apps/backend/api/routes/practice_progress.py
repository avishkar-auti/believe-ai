"""AI Practice Lab — read-only practice-progress summary."""

from __future__ import annotations

from fastapi import APIRouter

from api.dependencies import MongoUserIdDep
from schemas.practice_progress import PracticeProgressDto
from services import practice_progress_service

router = APIRouter(prefix="/practice/progress", tags=["practice-progress"])


@router.get("/", response_model=PracticeProgressDto)
async def get_progress_route(mongo_user_id: MongoUserIdDep) -> PracticeProgressDto:
    return await practice_progress_service.get_summary(mongo_user_id)
