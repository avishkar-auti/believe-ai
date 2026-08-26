"""Mirrors packages/server/src/models/Resume.model.ts — same "resumes"
collection, plus the separate "resumefiles" collection storing the original
uploaded bytes. One resume per user — re-uploading replaces both documents
wholesale so stale chunks/vectors from a previous resume can never survive
alongside new ones."""

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
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "resumes"
        indexes = [IndexModel([("userId", 1)], unique=True)]


class ResumeFile(Document):
    userId: PydanticObjectId
    fileName: str
    mimeType: str
    data: bytes
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "resumefiles"
        indexes = [IndexModel([("userId", 1)], unique=True)]
