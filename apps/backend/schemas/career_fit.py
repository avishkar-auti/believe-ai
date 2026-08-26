"""API-facing shapes for persisted Career Fit assessments — mirrors
packages/shared's CareerFit type."""

from __future__ import annotations

from pydantic import BaseModel, Field


class GenerateCareerFitInput(BaseModel):
    targetRole: str | None = Field(default=None, min_length=1)


class CareerFitDto(BaseModel):
    id: str
    userId: str
    targetRole: str | None
    summary: str
    strengths: list[str]
    skillGaps: list[str]
    suggestedRoles: list[str]
    createdAt: str
