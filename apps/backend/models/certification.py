"""One certification entry on the Profile page."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class Certification(Document):
    userId: PydanticObjectId
    name: str
    issuingOrg: str
    issueDate: str | None = None
    expirationDate: str | None = None
    credentialId: str | None = None
    credentialUrl: str | None = None
    order: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "certifications"
        indexes = [IndexModel([("userId", 1), ("order", 1)])]
