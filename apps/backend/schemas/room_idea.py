"""API-facing shapes for the shared idea board — mirrors packages/shared's
roomIdea types/schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CreateIdeaInput(BaseModel):
    questionId: str = Field(min_length=1)
    text: str = Field(min_length=1, max_length=500)


class RoomIdeaDto(BaseModel):
    id: str
    roomId: str
    questionId: str
    authorUserId: str
    authorName: str
    text: str
    createdAt: str
