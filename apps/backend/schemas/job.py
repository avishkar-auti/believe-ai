"""API-facing shapes for the Job Board — mirrors packages/shared's Job type
and job.schema.ts's Zod schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

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


class CreateJobInput(BaseModel):
    title: str = Field(min_length=1)
    company: str = Field(min_length=1)
    location: str | None = None
    description: str = Field(min_length=1)
    skills: list[str] = Field(default_factory=list)
    employmentType: EmploymentType | None = None
    workMode: WorkMode | None = None
    experienceLevel: ExperienceLevel | None = None
    salaryMin: float | None = Field(default=None, ge=0)
    salaryMax: float | None = Field(default=None, ge=0)
    recruiterLinkedIn: str | None = None
    applyUrl: str | None = None

    @model_validator(mode="after")
    def _check_salary_range(self) -> CreateJobInput:
        if self.salaryMin is not None and self.salaryMax is not None and self.salaryMax < self.salaryMin:
            raise ValueError("Maximum salary must be at or above the minimum.")
        return self


class UpdateJobInput(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    company: str | None = Field(default=None, min_length=1)
    location: str | None = None
    description: str | None = Field(default=None, min_length=1)
    skills: list[str] | None = None
    employmentType: EmploymentType | None = None
    workMode: WorkMode | None = None
    experienceLevel: ExperienceLevel | None = None
    salaryMin: float | None = Field(default=None, ge=0)
    salaryMax: float | None = Field(default=None, ge=0)
    recruiterLinkedIn: str | None = None
    applyUrl: str | None = None


class ToggleSaveInput(BaseModel):
    job: JobDto | None = None


class ToggleSaveResult(BaseModel):
    saved: bool
