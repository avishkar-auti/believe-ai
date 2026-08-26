"""Mirrors packages/server/src/models/UserContext.model.ts — same
"usercontexts" collection. One document per user (the "Believe Profile")
fed automatically into every AI call that benefits from sender context."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class UserContext(Document):
    userId: PydanticObjectId
    aboutMe: str | None = None
    companyInfo: str | None = None
    servicesOrProducts: str | None = None
    skillsAndExperience: str | None = None
    achievements: str | None = None
    targetAudience: str | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "usercontexts"
        indexes = [IndexModel([("userId", 1)], unique=True)]
