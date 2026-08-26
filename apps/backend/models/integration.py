"""Mirrors packages/server/src/models/Integration.model.ts — same
"integrations" collection, same field shapes and unique index."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

IntegrationProvider = Literal["gmail", "outlook"]


class Integration(Document):
    userId: PydanticObjectId
    provider: IntegrationProvider
    email: str
    # AES-256-GCM encrypted refresh token — never store OAuth secrets in plaintext.
    encryptedRefreshToken: str
    connectedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "integrations"
        indexes = [IndexModel([("userId", 1), ("provider", 1)], unique=True)]
