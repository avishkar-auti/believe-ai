"""API-facing shapes for the Live Practice Room — mirrors packages/shared's
mockInterviewRoom types/schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from models.mock_interview_room import MockInterviewRoomStatus, RoomQuestionSource


class ScheduleRoomInput(BaseModel):
    scheduledAt: datetime
    durationMinutes: int = Field(default=30, gt=0, le=180)
    targetSize: int = Field(default=4, ge=3, le=6)
    inviteEmails: list[EmailStr] = Field(default_factory=list, max_length=5)
    topic: str | None = Field(default=None, max_length=200)
    targetRole: str | None = Field(default=None, max_length=200)


class RoomParticipantDto(BaseModel):
    userId: str
    name: str
    joinedAt: str
    leftAt: str | None


class RoomQuestionDto(BaseModel):
    id: str
    text: str
    source: RoomQuestionSource
    order: int


class RoomLiveRecapDto(BaseModel):
    text: str
    updatedAt: str


class RoomPerStudentNoteDto(BaseModel):
    userId: str
    name: str
    strength: str
    growthArea: str
    averageRating: float | None


class RoomSummaryDto(BaseModel):
    groupSummary: str
    perStudent: list[RoomPerStudentNoteDto]
    generatedAt: str


class MockInterviewRoomDto(BaseModel):
    id: str
    code: str
    hostUserId: str
    hostName: str
    inviteEmails: list[str]
    topic: str | None
    targetRole: str | None
    scheduledAt: str
    durationMinutes: int
    minParticipants: int
    maxParticipants: int
    status: MockInterviewRoomStatus
    participants: list[RoomParticipantDto]
    questions: list[RoomQuestionDto]
    currentQuestionIndex: int
    currentSpeakerUserId: str | None
    turnStartedAt: str | None
    liveRecap: RoomLiveRecapDto | None
    summary: RoomSummaryDto | None
    joinable: bool
    createdAt: str


class IceServerDto(BaseModel):
    urls: str | list[str]
    username: str | None = None
    credential: str | None = None


class IceServersResult(BaseModel):
    iceServers: list[IceServerDto]


class RoomRecapDto(BaseModel):
    text: str
    updatedAt: str
