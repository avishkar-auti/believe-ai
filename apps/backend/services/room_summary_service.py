"""Group Practice Room: builds the post-call summary from the room's full
session — participants, questions, ideas, peer feedback comments, and any
transcript, all read-only via rooms_repository. Called once by the worker
job that runs after a host ends the room; nothing persists here, the caller
writes the result into the room's `summary` field."""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.room_summary_agent import generate_room_summary
from core.config import Settings
from core.errors import NotFoundError
from repositories import rooms_repository
from schemas.ai import RoomSummaryParticipant, RoomSummaryRequest, RoomSummaryResult


async def build_summary_for_room(settings: Settings, db: AsyncIOMotorDatabase, room_id: ObjectId) -> RoomSummaryResult:
    room = await rooms_repository.find_by_id(db, room_id)
    if not room:
        raise NotFoundError("Room not found")

    ideas = await rooms_repository.find_all_ideas(db, room_id)
    feedback = await rooms_repository.find_all_feedback(db, room_id)
    transcript = await rooms_repository.find_all_transcript(db, room_id)

    participants = [
        RoomSummaryParticipant(userId=str(p["userId"]), name=p["name"]) for p in (room.get("participants") or [])
    ]
    questions = [q["text"] for q in (room.get("questions") or [])]
    feedback_comments = [f["comment"] for f in feedback if f.get("comment")]

    return await generate_room_summary(
        settings,
        RoomSummaryRequest(
            topic=room.get("topic"),
            participants=participants,
            questions=questions,
            ideas=[idea["text"] for idea in ideas],
            feedbackComments=feedback_comments,
            transcript=[turn["text"] for turn in transcript],
        ),
    )
