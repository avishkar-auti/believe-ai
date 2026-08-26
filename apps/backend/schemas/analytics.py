"""API-facing shapes for the outreach dashboard — mirrors packages/shared's
analytics types."""

from __future__ import annotations

from pydantic import BaseModel

from models.email_log import EmailLogStatus
from schemas.campaign import CampaignDto


class DashboardStats(BaseModel):
    totalContacts: int
    emailsSent: int
    emailsDelivered: int
    openRate: float
    clickRate: float
    replyRate: float
    activeCampaigns: int
    scheduledCampaigns: int
    recentCampaigns: list[CampaignDto]


class EmailTrackingEntry(BaseModel):
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
    campaignName: str
    contactName: str
    contactEmail: str
