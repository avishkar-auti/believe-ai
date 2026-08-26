"""Mirrors packages/server/src/models/RoomIdea.model.ts — same "roomideas"
collection. One shared-idea-board note, posted against one question within
one practice room."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class RoomIdea(Document):
    roomId: PydanticObjectId
    questionId: str
    authorUserId: PydanticObjectId
    authorName: str
    text: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "roomideas"
        indexes = [IndexModel([("roomId", 1), ("questionId", 1), ("createdAt", 1)])]
