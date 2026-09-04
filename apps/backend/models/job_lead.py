"""Mirrors packages/server/src/models/JobLead.model.ts — same "jobleads"
collection. `workEmailPattern` is an inferred convention, never verified,
so a JobLead can only become a real, sendable Contact through an explicit
"add to contacts" step where the user supplies a real email."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

RelationshipStatus = Literal["connected", "not_connected", "unknown"]


class JobLead(Document):
    userId: PydanticObjectId
    jobIntelId: PydanticObjectId
    name: str
    title: str | None = None
    headline: str | None = None
    location: str | None = None
    linkedinUrl: str | None = None
    relevanceRank: int = 99
    # 0-100, explainable rather than a black-box score — see relevanceReasons.
    relevanceScore: int = 0
    relevanceReasons: list[str] = Field(default_factory=list)
    relationshipStatus: RelationshipStatus = "unknown"
    warmPath: bool = False
    warmPathReason: str | None = None
    workEmailPattern: str | None = None
    addedContactId: PydanticObjectId | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "jobleads"
        indexes = [IndexModel([("jobIntelId", 1), ("relevanceRank", 1)])]
