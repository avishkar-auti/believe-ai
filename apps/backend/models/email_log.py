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
    # `status` remains the single-value funnel milestone existing UI/state-
    # machine code reads (e.g. "has this recipient reached at least OPENED").
    # It is intentionally NOT the source of truth for analytics anymore — the
    # independent booleans below are, since a recipient can be opened=true,
    # clicked=true, and replied=true all at once without losing any of that
    # history the way a single mutually-exclusive field would.
    status: EmailLogStatus = "QUEUED"
    providerMessageId: str | None = None
    # Populated from the provider's send response when available (Gmail's
    # threadId today; Outlook's sendMail returns no body to read one from).
    # Lets reply-correlation use the provider's own thread grouping instead
    # of guessing from the subject line.
    threadId: str | None = None
    conversationId: str | None = None
    internetMessageId: str | None = None
    trackingToken: str
    openCount: int = 0
    clickCount: int = 0
    opened: bool = False
    lastOpenedAt: datetime | None = None
    clicked: bool = False
    firstClickedAt: datetime | None = None
    lastClickedAt: datetime | None = None
    replied: bool = False
    replyCount: int = 0
    firstRepliedAt: datetime | None = None
    lastRepliedAt: datetime | None = None
    # Bounce/complaint fields exist for when a provider webhook can populate
    # them — nothing in this codebase sets them today (no inbound bounce
    # signal exists yet), so they must never be inferred from silence.
    bounced: bool = False
    bouncedAt: datetime | None = None
    bounceReason: str | None = None
    complained: bool = False
    unsubscribed: bool = False
    lastActivityAt: datetime | None = None
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
            IndexModel([("campaignId", 1), ("opened", 1), ("replied", 1)]),
            IndexModel([("campaignId", 1), ("clicked", 1), ("replied", 1)]),
        ]
