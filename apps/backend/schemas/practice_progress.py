"""API-facing shape for the practice-progress summary — mirrors
packages/shared's PracticeProgress type."""

from __future__ import annotations

from pydantic import BaseModel


class ChallengeAttemptDto(BaseModel):
    challengeId: str
    submissionCount: int
    lastSubmittedAt: str
    solved: bool


class PracticeProgressDto(BaseModel):
    challengesAttempted: int
    challengesSolved: int
    totalSubmissions: int
    attempts: list[ChallengeAttemptDto]
    lastActivityAt: str | None
