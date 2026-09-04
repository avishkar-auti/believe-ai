"""API-facing shapes for discovered job leads — mirrors packages/shared's
JobLead type."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from models.job_lead import RelationshipStatus


class JobLeadDto(BaseModel):
    id: str
    userId: str
    jobIntelId: str
    name: str
    title: str | None
    headline: str | None
    location: str | None
    linkedinUrl: str | None
    relevanceRank: int
    relevanceScore: int
    relevanceReasons: list[str]
    relationshipStatus: RelationshipStatus
    warmPath: bool
    warmPathReason: str | None
    workEmailPattern: str | None
    addedContactId: str | None
    createdAt: str


class DiscoverLeadsInput(BaseModel):
    jobIntelId: str = Field(min_length=1)
    # Drops the location constraint entirely — a wider net when the first
    # search came back empty or too thin.
    broaden: bool = False
    # Replaces the job's parsed location with a user-supplied one instead —
    # for when that parse was wrong, or the role is open elsewhere.
    locationOverride: str | None = None


class AddToContactsInput(BaseModel):
    # Omitted entirely -> the contact is added for LinkedIn-message use only
    # (no real email on file, never emailed automatically). See
    # lead_discovery_service.add_to_contacts.
    email: EmailStr | None = None
