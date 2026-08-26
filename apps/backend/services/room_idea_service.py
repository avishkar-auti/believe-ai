"""Shared idea-board CRUD — mirrors apps/api's roomIdea.service.ts."""

from __future__ import annotations

from bson import ObjectId

from core.errors import NotFoundError
from models.room_idea import RoomIdea
from repositories import mock_interview_room_repository, room_idea_repository
from schemas.room_idea import RoomIdeaDto
from ws.mock_interview import broadcast_to_room


def _to_dto(doc: RoomIdea) -> RoomIdeaDto:
    assert doc.id is not None
    return RoomIdeaDto(
        id=str(doc.id),
        roomId=str(doc.roomId),
        questionId=doc.questionId,
        authorUserId=str(doc.authorUserId),
        authorName=doc.authorName,
        text=doc.text,
        createdAt=doc.createdAt.isoformat(),
    )


async def create(code: str, user_id: ObjectId, user_name: str, question_id: str, text: str) -> RoomIdeaDto:
    """Broadcasts the new idea over the room's live WS connection so every
    already-joined tab sees it immediately, in addition to persisting it —
    a late joiner or refresh instead hydrates via list()."""
    room = await mock_interview_room_repository.find_by_code(code)
    if not room:
        raise NotFoundError("Room not found")
    assert room.id is not None

    doc = await room_idea_repository.create(room.id, question_id, user_id, user_name, text)
    dto = _to_dto(doc)
    await broadcast_to_room(code, {"type": "idea-added", "idea": dto.model_dump()})
    return dto


async def list_ideas(code: str, question_id: str | None) -> list[RoomIdeaDto]:
    room = await mock_interview_room_repository.find_by_code(code)
    if not room:
        raise NotFoundError("Room not found")
    assert room.id is not None

    docs = await room_idea_repository.list_by_room(room.id, question_id)
    return [_to_dto(doc) for doc in docs]
