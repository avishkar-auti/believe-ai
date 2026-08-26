"""Group Practice Room: builds a rolling recap of the room's progress from
its recent shared-idea-board notes and browser-STT transcript, both optional
and read-only via rooms_repository. Server-side throttling of how often this
is actually invoked lives in apps/api — this always generates a fresh recap
when called."""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.room_recap_agent import generate_room_recap
from core.config import Settings
from core.errors import NotFoundError
from repositories import rooms_repository
from schemas.ai import RoomRecapRequest, RoomRecapResult


async def build_recap_for_room(settings: Settings, db: AsyncIOMotorDatabase, room_id: ObjectId) -> RoomRecapResult:
    room = await rooms_repository.find_by_id(db, room_id)
    if not room:
        raise NotFoundError("Room not found")

    ideas = await rooms_repository.find_recent_ideas(db, room_id)
    transcript = await rooms_repository.find_recent_transcript(db, room_id)

    questions = room.get("questions") or []
    current_index = room.get("currentQuestionIndex", 0)
    current_question = questions[current_index]["text"] if 0 <= current_index < len(questions) else None

    return await generate_room_recap(
        settings,
        RoomRecapRequest(
            topic=room.get("topic"),
            currentQuestionText=current_question,
            # Repository queries are most-recent-first for a cheap top-N read — reverse to
            # chronological order so the prompt reads like an actual session timeline.
            recentIdeas=[idea["text"] for idea in reversed(ideas)],
            recentTranscript=[turn["text"] for turn in reversed(transcript)],
        ),
    )
