"""A flat (non-nested) list of folders per user — matches the spec's sidebar
mockup. Nested folders are a real idea, deferred until there's demand."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class NoteFolder(Document):
    userId: PydanticObjectId
    name: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "notefolders"
        indexes = [IndexModel([("userId", 1)])]
