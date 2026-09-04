"""One entry in a user's education list — see models/experience.py for the
sibling Profile-page collection this mirrors structurally."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class Education(Document):
    userId: PydanticObjectId
    school: str
    degree: str | None = None
    fieldOfStudy: str | None = None
    startYear: int | None = None
    endYear: int | None = None
    grade: str | None = None
    description: str | None = None
    order: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "educations"
        indexes = [IndexModel([("userId", 1), ("order", 1)])]
