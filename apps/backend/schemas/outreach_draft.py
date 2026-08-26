"""API-facing shapes for outreach drafts — mirrors packages/shared's
OutreachDraft type."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from models.outreach_draft import DraftStatus, HookConfidence

DecidableDraftStatus = Literal["approved", "edited", "rejected"]


class OutreachDraftEditedTextInput(BaseModel):
    coldEmail: str | None = None
    linkedinNote: str | None = None
    referralRequest: str | None = None
    coverLetter: str | None = None


class OutreachDraftDto(BaseModel):
    id: str
    userId: str
    jobIntelId: str
    contactId: str
    contactName: str
    hook: str
    hookConfidence: HookConfidence
    coldEmail: str
    linkedinNote: str
    referralRequest: str | None
    coverLetter: str | None
    status: DraftStatus
    editedText: OutreachDraftEditedTextInput | None
    createdAt: str
    updatedAt: str


class GenerateDraftsInput(BaseModel):
    jobIntelId: str = Field(min_length=1)
    contactIds: list[str] = Field(min_length=1)


class DecideDraftInput(BaseModel):
    status: DecidableDraftStatus
    editedText: OutreachDraftEditedTextInput | None = None
