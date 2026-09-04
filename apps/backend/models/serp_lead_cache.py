"""Caches SerpAPI people-search results by company|location|category (e.g.
"google|pune|technical") so re-analyzing a similar role at the same company
doesn't re-spend a metered SerpAPI request. 14-day TTL via a Mongo expiry
index — recruiting contacts don't change fast enough to need fresher data
than that, and it's the single biggest lever for staying within quota.
Mirrors models/company_team_cache.py's shape."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel


class CachedPersonEntry(BaseModel):
    name: str
    headline: str | None = None
    profileUrl: str


class SerpLeadCache(Document):
    cacheKey: str  # "{company}|{city}|{technical|business}", all lowercased
    people: list[CachedPersonEntry] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "serpleadcaches"
        indexes = [
            IndexModel([("cacheKey", 1)], unique=True),
            IndexModel([("createdAt", 1)], expireAfterSeconds=14 * 24 * 60 * 60),
        ]
