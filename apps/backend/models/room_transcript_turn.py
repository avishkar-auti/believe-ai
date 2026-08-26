"""Mirrors packages/server/src/models/RoomTranscriptTurn.model.ts — same
"roomtranscriptturns" collection. A short chunk of browser-STT-captured
speech from one participant's turn."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

TranscriptSource = Literal["browser-stt"]


class RoomTranscriptTurn(Document):
    roomId: PydanticObjectId
    questionId: str | None = None
    speakerUserId: PydanticObjectId
    speakerName: str
    text: str
    source: TranscriptSource = "browser-stt"
    capturedAt: datetime
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "roomtranscriptturns"
        indexes = [IndexModel([("roomId", 1), ("capturedAt", 1)])]
