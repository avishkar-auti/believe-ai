"""API-facing shapes for the Job Board — mirrors packages/shared's Job type
and job.schema.ts's Zod schemas."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from pydantic import BaseModel

from models.job import EmploymentType, ExperienceLevel, JobSource, WorkMode

DatePostedFilter = Literal["any", "24h", "7d", "30d"]


class JobDto(BaseModel):
    id: str
    source: JobSource
    postedBy: str | None
    title: str
    company: str
    location: str | None
    description: str
    skills: list[str]
    employmentType: EmploymentType | None
    workMode: WorkMode | None
    experienceLevel: ExperienceLevel | None
    salaryMin: float | None
    salaryMax: float | None
    recruiterLinkedIn: str | None
    applyUrl: str | None
    createdAt: str
    updatedAt: str
    isSaved: bool | None = None


class LocationOption(BaseModel):
    country: str | None
    state: str | None
    city: str | None


class JobFilterOptions(BaseModel):
    locations: list[str]
    locationOptions: list[LocationOption]
    companies: list[str]
    skills: list[str]


class ToggleSaveInput(BaseModel):
    job: JobDto | None = None


class ToggleSaveResult(BaseModel):
    saved: bool


class JobMatchResult(BaseModel):
    """Deterministic, not AI-generated — see services/job_match_service.py.
    matchPercent is the real share of this job's listed skills found in the
    resume's text, never an invented similarity score."""

    matchPercent: int
    label: Literal["strong", "good", "partial"]
    matchedSkills: list[str]
    gapSkills: list[str]


class JobMatchInput(BaseModel):
    """Mirrors ToggleSaveInput's shape: internal jobs can be re-fetched
    server-side by id, but an external (jsearch) listing only exists as the
    live payload the frontend already holds, so the caller supplies it."""

    job: JobDto | None = None
    resumeId: PydanticObjectId | None = None
