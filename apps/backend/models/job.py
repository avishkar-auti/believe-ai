"""Mirrors packages/server/src/models/Job.model.ts — same "jobs" collection.
Only recruiter-posted listings live here — external (JSearch) results are
fetched live and merged into the list response, never persisted."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

JobSource = Literal["internal", "jsearch"]
EmploymentType = Literal["full_time", "part_time", "contract", "internship"]
WorkMode = Literal["remote", "hybrid", "onsite"]
ExperienceLevel = Literal["fresher", "junior", "mid", "senior", "lead"]


class Job(Document):
    postedBy: PydanticObjectId
    title: str
    company: str
    location: str | None = None
    description: str
    skills: list[str] = Field(default_factory=list)
    employmentType: EmploymentType | None = None
    workMode: WorkMode | None = None
    experienceLevel: ExperienceLevel | None = None
    salaryMin: float | None = None
    salaryMax: float | None = None
    recruiterLinkedIn: str | None = None
    applyUrl: str | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "jobs"
        indexes = [IndexModel([("createdAt", -1)]), IndexModel([("salaryMax", 1)])]
