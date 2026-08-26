"""Mirrors packages/server/src/models/OutreachSendLog.model.ts — same
"outreachsendlogs" collection. One row per send attempt (or per permanent
LinkedIn "drafted" record) for an approved OutreachDraft."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

OutreachSendChannel = Literal["email", "linkedin"]
OutreachSendStatus = Literal["sent", "drafted", "failed", "suppressed"]
OutreachSendContentType = Literal["cold_email", "linkedin_note", "follow_up"]


class OutreachSendLog(Document):
    userId: PydanticObjectId
    outreachDraftId: PydanticObjectId
    contactId: PydanticObjectId
    channel: OutreachSendChannel
    status: OutreachSendStatus
    contentType: OutreachSendContentType | None = None
    sentAt: datetime | None = None
    errorMessage: str | None = None
    providerMessageId: str | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "outreachsendlogs"
        indexes = [IndexModel([("outreachDraftId", 1), ("createdAt", -1)])]
