"""API-facing shapes for Profile > Education. See models/education.py."""

from __future__ import annotations

from pydantic import BaseModel, Field


class EducationDto(BaseModel):
    id: str
    school: str
    degree: str | None
    fieldOfStudy: str | None
    startYear: int | None
    endYear: int | None
    grade: str | None
    description: str | None
    order: int


class CreateEducationInput(BaseModel):
    school: str = Field(min_length=1)
    degree: str | None = None
    fieldOfStudy: str | None = None
    startYear: int | None = None
    endYear: int | None = None
    grade: str | None = None
    description: str | None = None


class UpdateEducationInput(BaseModel):
    school: str | None = Field(default=None, min_length=1)
    degree: str | None = None
    fieldOfStudy: str | None = None
    startYear: int | None = None
    endYear: int | None = None
    grade: str | None = None
    description: str | None = None
