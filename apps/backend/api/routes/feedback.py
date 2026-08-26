"""Mirrors apps/api's feedback.routes.ts."""

from __future__ import annotations

from fastapi import APIRouter

from api.dependencies import OptionalMongoUserIdDep
from schemas.feedback import CreateFeedbackInput, FeedbackDto
from services import feedback_service

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("/", response_model=FeedbackDto, status_code=201)
async def submit_feedback_route(body: CreateFeedbackInput, mongo_user_id: OptionalMongoUserIdDep) -> FeedbackDto:
    return await feedback_service.submit(mongo_user_id, body.message, body.page)
