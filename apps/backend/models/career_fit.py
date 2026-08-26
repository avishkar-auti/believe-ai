"""Mirrors packages/server/src/models/CareerFit.model.ts — same "careerfits"
collection. One document per generation — unlike Resume, history is kept so
a user can track how their assessment changes over time."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class CareerFit(Document):
    userId: PydanticObjectId
    targetRole: str | None = None
    summary: str
    strengths: list[str] = Field(default_factory=list)
    skillGaps: list[str] = Field(default_factory=list)
    suggestedRoles: list[str] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "careerfits"
        indexes = [IndexModel([("userId", 1), ("createdAt", -1)])]
