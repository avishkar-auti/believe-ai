"""Mirrors packages/server/src/models/Feedback.model.ts — same "feedbacks"
collection. userId is optional — feedback can be submitted while signed out."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field

FeedbackStatus = Literal["new", "reviewed", "resolved"]


class Feedback(Document):
    userId: PydanticObjectId | None = None
    message: str
    page: str | None = None
    status: FeedbackStatus = "new"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "feedbacks"
