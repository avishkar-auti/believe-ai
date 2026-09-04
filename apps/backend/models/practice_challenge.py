"""AI Practice Lab — a challenge is global curated content (no userId), not
per-user data. Hidden test cases live here but must never be serialized to
any public DTO (see schemas/practice_challenge.py)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel

ChallengeTrack = Literal["python-for-ai", "rag", "agents"]
ChallengeDifficulty = Literal["beginner", "intermediate", "advanced"]
ChallengeType = Literal["coding", "debugging", "system-design", "prompt-engineering"]
ChallengeStatus = Literal["draft", "published"]


class ChallengeStarterFile(BaseModel):
    path: str
    content: str
    readOnly: bool = False


class ChallengeTestCase(BaseModel):
    id: str = Field(default_factory=lambda: str(PydanticObjectId()))
    name: str
    input: str | None = None
    expectedOutput: str | None = None
    # hidden=False entries are the sample(s) shown in the Problem panel.
    hidden: bool = True


class ChallengeResource(BaseModel):
    title: str
    url: str


class Challenge(Document):
    slug: str
    title: str
    track: ChallengeTrack
    difficulty: ChallengeDifficulty
    challengeType: ChallengeType
    status: ChallengeStatus = "published"
    summary: str
    description: str
    tags: list[str] = Field(default_factory=list)
    estimatedMinutes: int | None = None
    starterFiles: list[ChallengeStarterFile] = Field(default_factory=list)
    testCases: list[ChallengeTestCase] = Field(default_factory=list)
    resources: list[ChallengeResource] = Field(default_factory=list)
    order: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "practice_challenges"
        indexes = [
            IndexModel([("slug", 1)], unique=True),
            IndexModel([("track", 1), ("difficulty", 1)]),
            IndexModel([("status", 1), ("order", 1)]),
        ]
