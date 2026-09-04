"""One achievement entry on the Profile page (hackathons, awards, papers,
open-source, etc.)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

AchievementCategory = Literal[
    "Hackathon", "Award", "Competition", "Scholarship", "Publication", "Open Source", "Conference", "Other"
]


class Achievement(Document):
    userId: PydanticObjectId
    title: str
    category: AchievementCategory = "Other"
    description: str | None = None
    date: str | None = None
    order: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "achievements"
        indexes = [IndexModel([("userId", 1), ("order", 1)])]
