"""API-facing shapes for persisted Roadmaps — mirrors packages/shared's
Roadmap type."""

from __future__ import annotations

from beanie import PydanticObjectId
from pydantic import BaseModel, Field

from models.roadmap import RoadmapDifficulty, RoadmapResourceType, SkillStatus


class GenerateRoadmapInput(BaseModel):
    goal: str = Field(min_length=1)
    personalize: bool = True
    resumeId: PydanticObjectId | None = None


class RoadmapResourceDto(BaseModel):
    title: str
    type: RoadmapResourceType
    url: str | None
    videoId: str | None
    channelName: str | None
    thumbnailUrl: str | None
    publishedAt: str | None
    durationSeconds: int | None


class RoadmapStageDto(BaseModel):
    title: str
    topics: list[str]
    difficulty: RoadmapDifficulty | None
    prerequisites: list[str]
    skillStatus: SkillStatus | None
    resources: list[RoadmapResourceDto]


class RoadmapDto(BaseModel):
    id: str
    userId: str
    goal: str
    detectedSkills: list[str]
    stages: list[RoadmapStageDto]
    createdAt: str
