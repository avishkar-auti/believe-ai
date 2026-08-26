"""Mirrors packages/server/src/models/SavedJob.model.ts — same "savedjobs"
collection. Stores a snapshot of the job's display fields rather than just a
reference, because external (jsearch) listings are never persisted
elsewhere — without a snapshot, a saved external job would vanish the
moment it fell off a live search result page."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel

from models.job import EmploymentType, ExperienceLevel, WorkMode


class JobSnapshot(BaseModel):
    source: str  # "internal" | "jsearch"
    title: str
    company: str
    location: str | None = None
    description: str = ""
    skills: list[str] = Field(default_factory=list)
    employmentType: EmploymentType | None = None
    workMode: WorkMode | None = None
    experienceLevel: ExperienceLevel | None = None
    salaryMin: float | None = None
    salaryMax: float | None = None
    recruiterLinkedIn: str | None = None
    applyUrl: str | None = None


class SavedJob(Document):
    userId: PydanticObjectId
    jobId: str
    snapshot: JobSnapshot
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "savedjobs"
        indexes = [IndexModel([("userId", 1), ("jobId", 1)], unique=True)]
