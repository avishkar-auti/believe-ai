"""Mirrors packages/server/src/models/Roadmap.model.ts — same "roadmaps"
collection. One document per generation — a user may want roadmaps for
several different goals."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel

RoadmapResourceType = Literal["documentation", "course", "book", "practice", "video", "article"]
RoadmapDifficulty = Literal["beginner", "intermediate", "advanced"]
SkillStatus = Literal["strong", "missing", "improve"]


class RoadmapResource(BaseModel):
    title: str
    type: RoadmapResourceType
    url: str | None = None
    # Only populated for type: "video", from a real YouTube Data API lookup.
    videoId: str | None = None
    channelName: str | None = None
    thumbnailUrl: str | None = None
    publishedAt: str | None = None
    durationSeconds: int | None = None


class RoadmapStage(BaseModel):
    title: str
    topics: list[str] = Field(default_factory=list)
    resources: list[RoadmapResource] = Field(default_factory=list)
    difficulty: RoadmapDifficulty | None = None
    prerequisites: list[str] = Field(default_factory=list)
    # Set only when the roadmap was generated with a resume on file.
    skillStatus: SkillStatus | None = None


class Roadmap(Document):
    userId: PydanticObjectId
    goal: str
    stages: list[RoadmapStage] = Field(default_factory=list)
    detectedSkills: list[str] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "roadmaps"
        indexes = [IndexModel([("userId", 1), ("createdAt", -1)])]
