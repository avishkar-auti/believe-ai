"""Generates and persists a Live Practice Room's post-call summary — mirrors
apps/worker's generateRoomSummary.ts. Enqueued by
services/mock_interview_room_service.end_room() when a host ends a room.
Star-rating averages are plain arithmetic, not an AI call — computed here
and merged into the AI-generated strength/growthArea notes rather than
asking the model to do math it might get wrong."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from beanie import PydanticObjectId
from bson import ObjectId

from core.config import get_settings
from core.db import get_database
from core.logging import get_logger
from models.mock_interview_room import RoomPerStudentNote, RoomSummary
from repositories import mock_interview_room_repository, room_feedback_repository
from services import notification_service
from services.room_summary_service import build_summary_for_room

logger = get_logger(__name__)


async def _average_ratings_by_room(room_id: ObjectId) -> dict[str, float]:
    rows = await room_feedback_repository.summary_by_room(room_id)
    return {str(r["_id"]): round(r["averageRating"] * 10) / 10 for r in rows}


async def generate_room_summary(ctx: dict[str, Any], room_id: str) -> None:
    settings = get_settings()
    db = get_database()
    room = await mock_interview_room_repository.find_by_id(ObjectId(room_id))
    if not room:
        logger.warning("Room summary skipped — room %s no longer exists", room_id)
        return
    assert room.id is not None

    ai_result = await build_summary_for_room(settings, db, room.id)
    average_ratings = await _average_ratings_by_room(room.id)

    summary = RoomSummary(
        groupSummary=ai_result.groupSummary,
        perStudent=[
            RoomPerStudentNote(
                userId=PydanticObjectId(s.userId),
                name=s.name,
                strength=s.strength,
                growthArea=s.growthArea,
                averageRating=average_ratings.get(s.userId),
            )
            for s in ai_result.perStudent
        ],
        generatedAt=datetime.now(UTC),
    )
    await mock_interview_room_repository.update_summary(room.id, summary)

    for participant in room.participants:
        body = (
            f'The AI summary for your "{room.topic}" practice room is ready to view.'
            if room.topic
            else "The AI summary for your practice room is ready to view."
        )
        await notification_service.create(
            participant.userId,
            "room.summary.ready",
            "Your practice room summary is ready",
            body,
            f"/app/interview-room/{room.code}/summary",
        )
