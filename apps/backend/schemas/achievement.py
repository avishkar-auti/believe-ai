"""API-facing shapes for Profile > Achievements. See models/achievement.py."""

from __future__ import annotations

from pydantic import BaseModel, Field

from models.achievement import AchievementCategory


class AchievementDto(BaseModel):
    id: str
    title: str
    category: AchievementCategory
    description: str | None
    date: str | None
    order: int


class CreateAchievementInput(BaseModel):
    title: str = Field(min_length=1)
    category: AchievementCategory = "Other"
    description: str | None = None
    date: str | None = None


class UpdateAchievementInput(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    category: AchievementCategory | None = None
    description: str | None = None
    date: str | None = None
