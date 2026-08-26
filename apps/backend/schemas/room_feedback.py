"""API-facing shapes for peer feedback — mirrors packages/shared's
roomFeedback types/schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SubmitRoomFeedbackInput(BaseModel):
    questionId: str = Field(min_length=1)
    turnSpeakerUserId: str = Field(min_length=1)
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)


class RoomFeedbackDto(BaseModel):
    id: str
    roomId: str
    questionId: str
    turnSpeakerUserId: str
    raterUserId: str
    raterName: str
    rating: int
    comment: str | None
    createdAt: str


class RoomFeedbackSummaryEntry(BaseModel):
    speakerUserId: str
    averageRating: float
    ratingCount: int
