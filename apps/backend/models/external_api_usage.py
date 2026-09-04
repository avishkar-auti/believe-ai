"""One row per call to a metered external API (currently just SerpAPI) —
lets usage be audited/reported on without depending on each provider's own
dashboard. Write-only from this service; nothing reads it back yet beyond
ad-hoc queries."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class ExternalApiUsage(Document):
    provider: str
    endpoint: str
    userId: PydanticObjectId
    success: bool
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "externalapiusages"
        indexes = [IndexModel([("provider", 1), ("createdAt", -1)])]
