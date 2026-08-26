"""Mirrors apps/api's roomFeedback.routes.ts, mounted at /mock-interview/{code}/feedback."""

from __future__ import annotations

from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, UserNameDep
from schemas.room_feedback import RoomFeedbackDto, RoomFeedbackSummaryEntry, SubmitRoomFeedbackInput
from services import room_feedback_service

router = APIRouter(prefix="/mock-interview/{code}/feedback", tags=["room-feedback"])


@router.post("/", response_model=RoomFeedbackDto, status_code=201)
async def submit_feedback_route(
    code: str, body: SubmitRoomFeedbackInput, mongo_user_id: MongoUserIdDep, user_name: UserNameDep
) -> RoomFeedbackDto:
    return await room_feedback_service.submit(code, mongo_user_id, user_name, body)


@router.get("/summary", response_model=list[RoomFeedbackSummaryEntry])
async def feedback_summary_route(code: str, _mongo_user_id: MongoUserIdDep) -> list[RoomFeedbackSummaryEntry]:
    return await room_feedback_service.summary(code)
