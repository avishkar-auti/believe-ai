"""API-facing shapes for Profile > Skills. See models/skill.py."""

from __future__ import annotations

from pydantic import BaseModel, Field

from models.skill import SkillCategory


class SkillDto(BaseModel):
    id: str
    name: str
    category: SkillCategory
    featured: bool
    order: int


class CreateSkillInput(BaseModel):
    name: str = Field(min_length=1)
    category: SkillCategory = "Programming"
    featured: bool = False


class UpdateSkillInput(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    category: SkillCategory | None = None
    featured: bool | None = None
