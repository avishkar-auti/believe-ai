"""Group Practice Room: generates AI question sets for a room, reading its
own topic/target-role/participant-count context (read-only, scoped by room
id). Ephemeral — nothing persists here; the caller (apps/api) writes the
result into the room's `questions` field."""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.room_question_agent import generate_room_questions
from core.config import Settings
from core.errors import NotFoundError
from repositories import rooms_repository
from schemas.ai import RoomQuestionsRequest, RoomQuestionsResult


async def generate_questions_for_room(settings: Settings, db: AsyncIOMotorDatabase, room_id: ObjectId) -> RoomQuestionsResult:
    room = await rooms_repository.find_by_id(db, room_id)
    if not room:
        raise NotFoundError("Room not found")

    participant_count = max(1, len(room.get("participants") or []) or room.get("minParticipants", 3))
    return await generate_room_questions(
        settings,
        RoomQuestionsRequest(
            topic=room.get("topic"),
            targetRole=room.get("targetRole"),
            participantCount=min(participant_count, 6),
        ),
    )
