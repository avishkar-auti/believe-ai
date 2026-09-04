"""Interview Prep — a session is persisted once, when the candidate reaches
the end of their question set (services/interview_session_service.py).
Question generation, coaching chat, and per-answer feedback all stay
ephemeral (see services/interview_service.py) — this is only the completed
session's summary, not a transcript, so no question/answer text is stored
here, only the per-answer scores needed to compute an honest aggregate."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class InterviewSession(Document):
    userId: PydanticObjectId
    targetRole: str | None = None
    interviewType: str
    difficulty: str | None = None
    totalQuestions: int
    answeredCount: int
    # None only when answeredCount is 0 — never a fabricated 0, which would
    # read as "failed everything" rather than "answered nothing".
    overallScore: int | None = None
    startedAt: datetime
    completedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "interview_sessions"
        indexes = [IndexModel([("userId", 1), ("completedAt", -1)])]
