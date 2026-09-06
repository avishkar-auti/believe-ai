"""Immutable per-recipient engagement history — a new event is appended for
every open/click/reply/etc rather than overwriting a single status field, so
the timeline a recipient's activity drawer needs (e.g. "opened 9:03am,
clicked the GitHub link at 9:05am, opened again at 2pm") isn't lost the way
`EmailLog`'s aggregate counters alone would lose it.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

EmailEventType = Literal["SENT", "OPENED", "CLICKED", "REPLIED", "BOUNCED", "FAILED", "UNSUBSCRIBED", "COMPLAINED"]


class EmailEvent(Document):
    campaignId: PydanticObjectId
    contactId: PydanticObjectId
    emailLogId: PydanticObjectId
    userId: PydanticObjectId
    type: EmailEventType
    # Only set for CLICKED events — which link on the page was clicked.
    linkId: PydanticObjectId | None = None
    metadata: dict = Field(default_factory=dict)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "email_events"
        indexes = [
            IndexModel([("campaignId", 1), ("createdAt", -1)]),
            IndexModel([("emailLogId", 1), ("createdAt", -1)]),
            IndexModel([("emailLogId", 1), ("type", 1)]),
        ]
