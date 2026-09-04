"""API-facing shapes for persisted Career Fit assessments — mirrors
packages/shared's CareerFit type."""

from __future__ import annotations

from beanie import PydanticObjectId
from pydantic import BaseModel, Field


class GenerateCareerFitInput(BaseModel):
    targetRole: str | None = Field(default=None, min_length=1)
    # Which resume to analyze — defaults to whichever is Primary when omitted.
    resumeId: PydanticObjectId | None = None


class CareerFitDto(BaseModel):
    id: str
    userId: str
    targetRole: str | None
    summary: str
    strengths: list[str]
    skillGaps: list[str]
    suggestedRoles: list[str]
    fitScore: int
    createdAt: str
