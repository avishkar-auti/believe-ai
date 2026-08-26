"""Browser-STT transcript append — mirrors apps/api's roomTranscript.service.ts."""

from __future__ import annotations

from datetime import UTC, datetime

from bson import ObjectId

from core.errors import NotFoundError
from repositories import mock_interview_room_repository, room_transcript_repository
from schemas.room_transcript import AppendTranscriptChunkInput


async def append(code: str, user_id: ObjectId, user_name: str, input_: AppendTranscriptChunkInput) -> None:
    """Persists a batched browser-STT chunk (~10-15s of speech) captured
    during the caller's own turn. Not broadcast over WS — unlike ideas and
    feedback, the transcript isn't shown live; it's only ever read back in
    aggregate by the recap agent."""
    room = await mock_interview_room_repository.find_by_code(code)
    if not room:
        raise NotFoundError("Room not found")
    assert room.id is not None

    await room_transcript_repository.create(
        room.id, input_.questionId, user_id, user_name, input_.text, input_.capturedAt or datetime.now(UTC)
    )
