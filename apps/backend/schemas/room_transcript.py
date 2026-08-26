"""API-facing shapes for browser-STT transcript turns — mirrors
packages/shared's roomTranscript types/schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AppendTranscriptChunkInput(BaseModel):
    questionId: str | None = Field(default=None, min_length=1)
    text: str = Field(min_length=1, max_length=2000)
    capturedAt: datetime | None = None
