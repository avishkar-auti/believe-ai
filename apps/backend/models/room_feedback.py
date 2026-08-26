"""Mirrors packages/server/src/models/RoomFeedback.model.ts — same
"roomfeedbacks" collection. One peer's star rating (+ optional comment) for
another participant's turn on a specific question — unique per (room,
question, speaker, rater) so a resubmission upserts in place."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class RoomFeedback(Document):
    roomId: PydanticObjectId
    questionId: str
    turnSpeakerUserId: PydanticObjectId
    raterUserId: PydanticObjectId
    raterName: str
    rating: int
    comment: str | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "roomfeedbacks"
        indexes = [
            IndexModel(
                [("roomId", 1), ("questionId", 1), ("turnSpeakerUserId", 1), ("raterUserId", 1)],
                unique=True,
            )
        ]
