"""API-facing shapes for the caller's own resumes — mirrors packages/shared's
Resume type."""

from __future__ import annotations

from pydantic import BaseModel


class ResumeChunkDto(BaseModel):
    text: str
    vector: list[float] | None


class ResumeDto(BaseModel):
    id: str
    userId: str
    fileName: str
    mimeType: str
    sizeBytes: int
    content: str
    chunks: list[ResumeChunkDto]
    embeddingReady: bool
    isPrimary: bool
    targetRole: str | None
    createdAt: str
    updatedAt: str


class UpdateResumeInput(BaseModel):
    targetRole: str | None = None
