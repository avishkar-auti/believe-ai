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
    pinned: bool
    archived: bool
    linkedEntityType: str | None
    linkedEntityId: str | None
    linkedEntityLabel: str | None
    createdAt: str
    updatedAt: str


class NoteSummaryDto(BaseModel):
    """List-view shape — omits the full editor content, which can be large,
    but includes a short plainText preview so the list can show a snippet."""

    id: str
    title: str
    preview: str
    folderId: str | None
    tags: list[str]
    pinned: bool
    archived: bool
    linkedEntityType: str | None
    linkedEntityId: str | None
    linkedEntityLabel: str | None
    updatedAt: str


class CreateNoteInput(BaseModel):
    title: str = Field(default="Untitled note")
    content: dict[str, Any] = Field(default_factory=dict)
    folderId: str | None = None
    tags: list[str] = Field(default_factory=list)
    linkedEntityType: str | None = None
    linkedEntityId: str | None = None
    linkedEntityLabel: str | None = None


class UpdateNoteInput(BaseModel):
    title: str | None = None
    content: dict[str, Any] | None = None
    folderId: str | None = None
    tags: list[str] | None = None
    pinned: bool | None = None
    archived: bool | None = None
    linkedEntityType: str | None = None
    linkedEntityId: str | None = None
    linkedEntityLabel: str | None = None


NoteView = Literal["active", "archived", "trash"]


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
