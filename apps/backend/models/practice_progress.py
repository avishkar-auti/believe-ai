"""AI Practice Lab — one document per user, mirrors models/user_context.py's
upsert-on-write shape. Tracks only honest activity counters: no XP, no
streaks, no skill scores. `solved`/`challengesSolved` are real — driven by
actual Judge0 test outcomes, never set for a challenge that only ever ran
behind MockExecutionService (see services/submission_service.py)."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel


class ChallengeAttempt(BaseModel):
    challengeId: PydanticObjectId
    submissionCount: int = 0
    lastSubmittedAt: datetime
    # Once True, stays True — a later worse submission doesn't "unsolve" a
    # challenge, same convention as every other coding-practice platform.
    solved: bool = False


class UserPracticeProgress(Document):
    userId: PydanticObjectId
    challengesAttempted: int = 0
    challengesSolved: int = 0
    totalSubmissions: int = 0
    attempts: list[ChallengeAttempt] = Field(default_factory=list)
    lastActivityAt: datetime | None = None
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "user_practice_progress"
        indexes = [IndexModel([("userId", 1)], unique=True)]
