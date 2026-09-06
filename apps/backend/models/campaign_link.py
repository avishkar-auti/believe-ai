"""A stable, trackable identity for each unique destination URL a campaign's
template links to — what per-link click analytics (Top Clicked Links,
Project Engagement) count against. Without this, the existing per-recipient
`trackingToken` treats every link in the email as the same, undifferentiated
click.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

LinkCategory = Literal[
    "RESUME",
    "PORTFOLIO",
    "GITHUB",
    "LINKEDIN",
    "PROJECT",
    "CODING_PROFILE",
    "CERTIFICATE",
    "PERSONAL_WEBSITE",
    "OTHER",
]


class CampaignLink(Document):
    campaignId: PydanticObjectId
    userId: PydanticObjectId
    url: str
    category: LinkCategory = "OTHER"
    label: str | None = None
    clickCount: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "campaign_links"
        indexes = [
            IndexModel([("campaignId", 1), ("url", 1)], unique=True),
            IndexModel([("campaignId", 1), ("clickCount", -1)]),
        ]
