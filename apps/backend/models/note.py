"""Believe Notes — one Note per document, its TipTap/ProseMirror JSON body
plus a derived plainText mirror kept in sync on every save (used for
embedding/AI context, never edited directly). NoteChunk mirrors
models/resume.py's ResumeChunk exactly — same in-Mongo vector-field RAG
pattern, no separate vector database."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel


class NoteChunk(BaseModel):
    text: str
    vector: list[float] | None = None


class Note(Document):
    userId: PydanticObjectId
    title: str
    content: dict[str, Any]
    plainText: str
    folderId: PydanticObjectId | None = None
    tags: list[str] = Field(default_factory=list)
    chunks: list[NoteChunk] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "notes"
        indexes = [
            IndexModel([("userId", 1), ("folderId", 1)]),
            IndexModel([("userId", 1), ("tags", 1)]),
            IndexModel([("userId", 1), ("updatedAt", -1)]),
        ]
