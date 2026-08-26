"""API-facing shapes for discovered job leads — mirrors packages/shared's
JobLead type."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class JobLeadDto(BaseModel):
    id: str
    userId: str
    jobIntelId: str
    name: str
    title: str | None
    linkedinUrl: str | None
    relevanceRank: int
    warmPath: bool
    warmPathReason: str | None
    workEmailPattern: str | None
    addedContactId: str | None
    createdAt: str


class DiscoverLeadsInput(BaseModel):
    jobIntelId: str = Field(min_length=1)


class AddToContactsInput(BaseModel):
    email: EmailStr
