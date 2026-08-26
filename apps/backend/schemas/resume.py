"""API-facing shapes for the caller's own resume — mirrors packages/shared's
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
    createdAt: str
    updatedAt: str
