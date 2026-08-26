"""Mirrors packages/server/src/models/Campaign.model.ts — same "campaigns"
collection, same field shapes and indexes."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel

CampaignStatus = Literal["DRAFT", "SCHEDULED", "RUNNING", "PAUSED", "COMPLETED", "CANCELLED", "FAILED"]

CAMPAIGN_STATUS_TRANSITIONS: dict[CampaignStatus, list[CampaignStatus]] = {
    "DRAFT": ["SCHEDULED", "RUNNING", "CANCELLED"],
    "SCHEDULED": ["RUNNING", "CANCELLED"],
    "RUNNING": ["PAUSED", "COMPLETED", "CANCELLED", "FAILED"],
    "PAUSED": ["RUNNING", "CANCELLED"],
    "COMPLETED": [],
    "CANCELLED": [],
    "FAILED": [],
}


class CampaignFollowUp(BaseModel):
    templateId: PydanticObjectId
    delayDays: int
    subjectOverride: str | None = None


class Campaign(Document):
    userId: PydanticObjectId
    name: str
    subject: str
    templateId: PydanticObjectId
    audienceContactIds: list[PydanticObjectId] = Field(default_factory=list)
    status: CampaignStatus = "DRAFT"
    scheduledAt: datetime | None = None
    timezone: str = "UTC"
    dailyLimit: int = 200
    personalizationEnabled: bool = True
    trackingEnabled: bool = True
    followUps: list[CampaignFollowUp] = Field(default_factory=list)
    stopOnReply: bool = True
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "campaigns"
        indexes = [
            IndexModel([("userId", 1), ("status", 1)]),
            IndexModel([("userId", 1), ("createdAt", -1)]),
        ]
