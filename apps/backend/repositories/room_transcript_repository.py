"""Beanie-backed access to browser-STT transcript turns — mirrors apps/api's
roomTranscript.repository.ts."""

from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from models.room_transcript_turn import RoomTranscriptTurn


async def create(
    room_id: ObjectId,
    question_id: str | None,
    speaker_user_id: ObjectId,
    speaker_name: str,
    text: str,
    captured_at: datetime,
) -> RoomTranscriptTurn:
    doc = RoomTranscriptTurn(
        roomId=room_id, questionId=question_id, speakerUserId=speaker_user_id, speakerName=speaker_name, text=text, capturedAt=captured_at
    )
    await doc.insert()
    return doc
