"""Design Studio projects — a named workspace owning a set of DesignScreens,
each with its own canvas. updatedAt bumps on real creative activity (a screen
created/edited inside it), never on a screen drag or delete — same
distinction models/design_screen.py already draws for its own updatedAt."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class DesignProject(Document):
    userId: PydanticObjectId
    name: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "designprojects"
        indexes = [IndexModel([("userId", 1), ("updatedAt", -1)])]
