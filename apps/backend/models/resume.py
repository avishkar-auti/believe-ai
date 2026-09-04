"""Mirrors packages/server/src/models/Resume.model.ts — same "resumes"
collection, plus the separate "resumefiles" collection storing the original
uploaded bytes. Many resumes per user, one of them flagged `isPrimary` —
the "Ask My Resume"/Career Fit/Roadmap/Interview Prep/Outreach Draft
consumers all default to whichever one that is when a caller doesn't ask
for a specific resume by id. Uploading never replaces an existing resume
any more; ResumeFile is 1:1 with a Resume (via resumeId), not with a user."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel


class ResumeChunk(BaseModel):
    text: str
    # Null until the embedding step has run for this chunk.
    vector: list[float] | None = None


class Resume(Document):
    userId: PydanticObjectId
    fileName: str
    mimeType: str
    sizeBytes: int
    content: str
    chunks: list[ResumeChunk] = Field(default_factory=list)
    isPrimary: bool = False
    targetRole: str | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "resumes"
        indexes = [IndexModel([("userId", 1), ("createdAt", -1)])]


class ResumeFile(Document):
    resumeId: PydanticObjectId
    userId: PydanticObjectId
    fileName: str
    mimeType: str
    data: bytes
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "resumefiles"
        indexes = [IndexModel([("resumeId", 1)], unique=True)]
