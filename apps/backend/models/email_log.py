"""Mirrors packages/server/src/models/EmailLog.model.ts — same "emaillogs"
collection, same field shapes and indexes."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

EmailLogStatus = Literal["QUEUED", "SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED", "BOUNCED", "FAILED"]


class EmailLog(Document):
    campaignId: PydanticObjectId
    contactId: PydanticObjectId
    userId: PydanticObjectId
    stepIndex: int = 0
    status: EmailLogStatus = "QUEUED"
    providerMessageId: str | None = None
    trackingToken: str
    openCount: int = 0
    clickCount: int = 0
    replied: bool = False
    errorMessage: str | None = None
    sentAt: datetime | None = None
    openedAt: datetime | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "emaillogs"
        indexes = [
            IndexModel([("campaignId", 1), ("status", 1)]),
            IndexModel([("campaignId", 1), ("contactId", 1), ("stepIndex", 1)], unique=True),
            IndexModel([("trackingToken", 1)], unique=True),
        ]
