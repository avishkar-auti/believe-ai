"""Mirrors packages/server/src/models/UnsubscribeRecord.model.ts — same
"unsubscriberecords" collection. Read-only from this service today: CSV
import checks it to skip unsubscribed emails; nothing here writes to it yet
(unsubscribe itself is still a Node-owned action, ported in a later phase)."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class UnsubscribeRecord(Document):
    userId: PydanticObjectId
    email: str
    reason: str | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "unsubscriberecords"
        indexes = [IndexModel([("userId", 1), ("email", 1)], unique=True)]
