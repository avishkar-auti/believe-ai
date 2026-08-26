"""Mirrors packages/server/src/models/Notification.model.ts — same
"notifications" collection, surfaced in the web app's topbar bell."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

NotificationType = Literal[
    "campaign.completed",
    "contacts.imported",
    "integration.disconnected",
    "room.summary.ready",
]


class Notification(Document):
    userId: PydanticObjectId
    type: NotificationType
    title: str
    body: str = ""
    link: str | None = None
    read: bool = False
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "notifications"
        indexes = [
            IndexModel([("userId", 1), ("createdAt", -1)]),
            IndexModel([("userId", 1), ("read", 1)]),
        ]
