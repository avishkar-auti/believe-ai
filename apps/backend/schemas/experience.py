"""API-facing shapes for Profile > Experience. See models/experience.py for
the persisted Beanie Document this is derived from."""

from __future__ import annotations

from pydantic import BaseModel, Field

from models.experience import EmploymentType


class ExperienceDto(BaseModel):
    id: str
    title: str
    company: str
    employmentType: EmploymentType
    location: str | None
    startDate: str | None
    endDate: str | None
    isCurrent: bool
    description: str | None
    order: int


class CreateExperienceInput(BaseModel):
    title: str = Field(min_length=1)
    company: str = Field(min_length=1)
    employmentType: EmploymentType = "Full-time"
    location: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    isCurrent: bool = False
    description: str | None = None


class UpdateExperienceInput(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    company: str | None = Field(default=None, min_length=1)
    employmentType: EmploymentType | None = None
    location: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    isCurrent: bool | None = None
    description: str | None = None
