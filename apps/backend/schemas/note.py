"""API-facing shapes for Believe Notes."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class NoteDto(BaseModel):
    id: str
    title: str
    content: dict[str, Any]
    folderId: str | None
    tags: list[str]
    createdAt: str
    updatedAt: str


class NoteSummaryDto(BaseModel):
    """List-view shape — omits the full editor content, which can be large."""

    id: str
    title: str
    folderId: str | None
    tags: list[str]
    updatedAt: str


class CreateNoteInput(BaseModel):
    title: str = Field(default="Untitled note")
    content: dict[str, Any] = Field(default_factory=dict)
    folderId: str | None = None
    tags: list[str] = Field(default_factory=list)


class UpdateNoteInput(BaseModel):
    title: str | None = None
    content: dict[str, Any] | None = None
    folderId: str | None = None
    tags: list[str] | None = None


class NoteFolderDto(BaseModel):
    id: str
    name: str
    createdAt: str


class CreateNoteFolderInput(BaseModel):
    name: str = Field(min_length=1)


class NoteAttachmentDto(BaseModel):
    id: str
    noteId: str
    filename: str
    contentType: str
    createdAt: str


class RelatedNoteDto(BaseModel):
    id: str
    title: str
    score: float | None


class NoteSearchResultDto(BaseModel):
    id: str
    title: str
    snippet: str
    score: float | None


class NoteFlashcardDto(BaseModel):
    id: str
    noteId: str
    noteTitle: str
    front: str
    back: str
    dueAt: str
    repetitions: int


ReviewGrade = Literal["again", "hard", "good", "easy"]


class ReviewFlashcardInput(BaseModel):
    grade: ReviewGrade


class SaveFlashcardsInput(BaseModel):
    cardCount: int = Field(default=8, ge=1, le=20)
