"""Avatar/cover image bytes — mirrors models/note_attachment.py's "raw bytes
on the document, no object storage" pattern. One document per (userId, kind),
upserted on every upload."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

ProfileImageKind = Literal["avatar", "cover"]


class ProfileImage(Document):
    userId: PydanticObjectId
    kind: ProfileImageKind
    data: bytes
    contentType: str
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "profileimages"
        indexes = [IndexModel([("userId", 1), ("kind", 1)], unique=True)]
