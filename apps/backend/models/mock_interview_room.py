"""Mirrors packages/server/src/models/MockInterviewRoom.model.ts — same
"mockinterviewrooms" collection, same field shapes. currentQuestionIndex/
currentSpeakerUserId/turnStartedAt mirror the live WS turn state — the WS
server is the source of truth while the room is live, this is a snapshot
for REST reads (page refresh, late joiners before the socket connects) and
for the summary agent once the room has ended.

Deliberately has no TTL/expiresAt index — a createdAt-relative TTL would
delete a room booked more than a day ahead before it ever happens. Join
eligibility is computed at request time from scheduledAt + durationMinutes
(see utils/room_joinable.py), not stored here.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel

MockInterviewRoomStatus = Literal["scheduled", "completed", "cancelled"]
RoomQuestionSource = Literal["manual", "ai"]


class RoomParticipant(BaseModel):
    userId: PydanticObjectId
    name: str
    joinedAt: datetime
    leftAt: datetime | None = None


class RoomQuestion(BaseModel):
    id: str
    text: str
    source: RoomQuestionSource
    order: int


class RoomLiveRecap(BaseModel):
    text: str
    updatedAt: datetime


class RoomPerStudentNote(BaseModel):
    userId: PydanticObjectId
    name: str
    strength: str
    growthArea: str
    averageRating: float | None = None


class RoomSummary(BaseModel):
    groupSummary: str
    perStudent: list[RoomPerStudentNote] = Field(default_factory=list)
    generatedAt: datetime


class MockInterviewRoom(Document):
    code: str
    hostUserId: PydanticObjectId
    hostName: str
    inviteEmails: list[str] = Field(default_factory=list)
    topic: str | None = None
    targetRole: str | None = None
    scheduledAt: datetime
    durationMinutes: int = 30
    minParticipants: int = 3
    maxParticipants: int = 6
    status: MockInterviewRoomStatus = "scheduled"
    participants: list[RoomParticipant] = Field(default_factory=list)
    questions: list[RoomQuestion] = Field(default_factory=list)
    currentQuestionIndex: int = 0
    currentSpeakerUserId: PydanticObjectId | None = None
    turnStartedAt: datetime | None = None
    liveRecap: RoomLiveRecap | None = None
    summary: RoomSummary | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "mockinterviewrooms"
        indexes = [
            IndexModel([("code", 1)], unique=True),
            IndexModel([("hostUserId", 1), ("scheduledAt", -1)]),
        ]
