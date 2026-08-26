"""Mirrors packages/server/src/models/OutreachDraft.model.ts — same
"outreachdrafts" collection. Every draft starts "pending" and must be
explicitly approved/edited/rejected before anything is ever sent."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel

DraftStatus = Literal["pending", "approved", "edited", "rejected"]
HookConfidence = Literal["high", "low"]


class OutreachDraftEditedText(BaseModel):
    coldEmail: str | None = None
    linkedinNote: str | None = None
    referralRequest: str | None = None
    coverLetter: str | None = None


class OutreachDraft(Document):
    userId: PydanticObjectId
    jobIntelId: PydanticObjectId
    contactId: PydanticObjectId
    contactName: str
    hook: str
    hookConfidence: HookConfidence
    coldEmail: str
    linkedinNote: str
    referralRequest: str | None = None
    coverLetter: str | None = None
    status: DraftStatus = "pending"
    editedText: OutreachDraftEditedText | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "outreachdrafts"
        indexes = [IndexModel([("jobIntelId", 1), ("createdAt", -1)])]
