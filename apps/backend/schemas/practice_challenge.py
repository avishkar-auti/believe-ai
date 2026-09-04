"""API-facing shapes for AI Practice Lab challenges — mirrors
packages/shared's Challenge types. ChallengeDetailDto deliberately has no
`testCases` field: the service layer builds `sampleTests` from only the
non-hidden ones, so hidden test definitions never leave the server."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from models.practice_challenge import ChallengeDifficulty, ChallengeTrack, ChallengeType

# Resolved per-request against the caller's own progress — never stored on
# Challenge, which is global, shared content. "solved" only ever applies to
# challenges with real Judge0 execution (see UserPracticeProgress) — a
# challenge that only ever ran behind MockExecutionService can be
# "attempted" but never "solved", since nothing verified it.
ChallengeStatusFilter = Literal["unsolved", "attempted", "solved"]


class ChallengeSummaryDto(BaseModel):
    id: str
    slug: str
    title: str
    track: ChallengeTrack
    difficulty: ChallengeDifficulty
    challengeType: ChallengeType
    summary: str
    tags: list[str]
    estimatedMinutes: int | None
    status: ChallengeStatusFilter


class ChallengeStarterFileDto(BaseModel):
    path: str
    content: str
    readOnly: bool


class SampleTestDto(BaseModel):
    name: str
    input: str | None
    expectedOutput: str | None


class ChallengeResourceDto(BaseModel):
    title: str
    url: str


class ChallengeDetailDto(ChallengeSummaryDto):
    description: str
    starterFiles: list[ChallengeStarterFileDto]
    sampleTests: list[SampleTestDto]
    resources: list[ChallengeResourceDto]
