"""Note images/files — mirrors models/resume.py's ResumeFile: raw bytes
stored directly on the Mongo document. No object storage exists anywhere in
this app; this is the established, size-capped pattern to reuse rather than
standing up new infra for it."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class NoteAttachment(Document):
    noteId: PydanticObjectId
    userId: PydanticObjectId
    filename: str
    contentType: str
    data: bytes
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "noteattachments"
        indexes = [IndexModel([("noteId", 1)])]
