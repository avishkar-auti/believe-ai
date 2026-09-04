"""One skill pill on the Profile page. `featured` marks it as one of the
user's "Top Skills" — capped at 5, enforced in services/skill_service.py."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

SkillCategory = Literal[
    "Programming", "Frontend", "Backend", "Cloud", "DevOps", "AI / ML", "Databases", "Tools", "Soft Skills"
]


class Skill(Document):
    userId: PydanticObjectId
    name: str
    category: SkillCategory = "Programming"
    featured: bool = False
    order: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "skills"
        indexes = [
            IndexModel([("userId", 1), ("order", 1)]),
            IndexModel([("userId", 1), ("name", 1)], unique=True),
        ]
