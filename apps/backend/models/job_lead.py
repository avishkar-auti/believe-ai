"""Mirrors packages/server/src/models/JobLead.model.ts — same "jobleads"
collection. `workEmailPattern` is an inferred convention, never verified,
so a JobLead can only become a real, sendable Contact through an explicit
"add to contacts" step where the user supplies a real email."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class JobLead(Document):
    userId: PydanticObjectId
    jobIntelId: PydanticObjectId
    name: str
    title: str | None = None
    linkedinUrl: str | None = None
    relevanceRank: int = 99
    warmPath: bool = False
    warmPathReason: str | None = None
    workEmailPattern: str | None = None
    addedContactId: PydanticObjectId | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "jobleads"
        indexes = [IndexModel([("jobIntelId", 1), ("relevanceRank", 1)])]
