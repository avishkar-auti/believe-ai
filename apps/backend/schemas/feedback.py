"""API-facing shapes for user-submitted feedback — mirrors packages/shared's
feedback types/schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field

from models.feedback import FeedbackStatus


class CreateFeedbackInput(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    page: str | None = Field(default=None, max_length=500)


class FeedbackDto(BaseModel):
    id: str
    userId: str | None
    message: str
    page: str | None
    status: FeedbackStatus
    createdAt: str
