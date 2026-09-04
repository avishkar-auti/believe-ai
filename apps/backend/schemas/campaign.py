"""API-facing shapes for campaigns — mirrors packages/shared's Campaign/
CampaignAnalytics/EmailLog types and campaign.schema.ts's Zod schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field

from models.campaign import CampaignStatus
from models.email_log import EmailLogStatus


class CampaignFollowUpInput(BaseModel):
    templateId: str = Field(min_length=1)
    delayDays: int = Field(gt=0, le=90)
    subjectOverride: str | None = None


class CampaignFollowUpDto(BaseModel):
    templateId: str
    delayDays: int
    subjectOverride: str | None


class CreateCampaignInput(BaseModel):
    name: str = Field(min_length=1)
    subject: str = Field(min_length=1)
    templateId: str = Field(min_length=1)
    # Attached to every send in this campaign, if set. Opt-in per campaign —
    # never auto-filled from whichever resume is Primary.
    resumeId: str | None = None
    audienceContactIds: list[str] = Field(min_length=1)
    scheduledAt: str | None = None
    timezone: str = Field(default="UTC", min_length=1)
    dailyLimit: int = Field(default=200, gt=0, le=2000)
    personalizationEnabled: bool = True
    trackingEnabled: bool = True
    followUps: list[CampaignFollowUpInput] = Field(default_factory=list)
    stopOnReply: bool = True


class UpdateCampaignInput(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    subject: str | None = Field(default=None, min_length=1)
    templateId: str | None = Field(default=None, min_length=1)
    resumeId: str | None = None
    audienceContactIds: list[str] | None = Field(default=None, min_length=1)
    scheduledAt: str | None = None
    timezone: str | None = Field(default=None, min_length=1)
    dailyLimit: int | None = Field(default=None, gt=0, le=2000)
    personalizationEnabled: bool | None = None
    trackingEnabled: bool | None = None
    followUps: list[CampaignFollowUpInput] | None = None
    stopOnReply: bool | None = None


class CampaignDto(BaseModel):
    id: str
    userId: str
    name: str
    subject: str
    templateId: str
    resumeId: str | None
    audienceContactIds: list[str]
    status: CampaignStatus
    scheduledAt: str | None
    timezone: str
    dailyLimit: int
    personalizationEnabled: bool
    trackingEnabled: bool
    followUps: list[CampaignFollowUpDto]
    stopOnReply: bool
    createdAt: str
    updatedAt: str


class CampaignAnalytics(BaseModel):
    sent: int
    delivered: int
    opened: int
    clicked: int
    replied: int
    bounced: int
    failed: int
    openRate: float
    clickRate: float
    replyRate: float
    bounceRate: float


class EmailLogDto(BaseModel):
    id: str
    campaignId: str
    contactId: str
    userId: str
    stepIndex: int
    status: EmailLogStatus
    providerMessageId: str | None
    trackingToken: str
    openCount: int
    clickCount: int
    replied: bool
    errorMessage: str | None
    sentAt: str | None
    openedAt: str | None
    createdAt: str
    updatedAt: str


class MarkRepliedResult(BaseModel):
    marked: bool
