"""Mirrors packages/server/src/models/OutreachFollowUp.model.ts — same
"outreachfollowups" collection. Day 3/7/14 follow-up cadence for one
contact's approved OutreachDraft, capped at 3 (sequenceNumber 1-3)."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class OutreachFollowUp(Document):
    userId: PydanticObjectId
    outreachDraftId: PydanticObjectId
    contactId: PydanticObjectId
    sequenceNumber: int = Field(ge=1, le=3)
    scheduledFor: datetime
    sent: bool = False
    cancelled: bool = False
    cancelReason: str | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "outreachfollowups"
        indexes = [IndexModel([("outreachDraftId", 1), ("sequenceNumber", 1)])]
