"""Mirrors packages/server/src/models/YoutubeCache.model.ts — same
"youtubecaches" collection. Caches YouTube Data API search results by query
so repeated roadmap generations for the same topic don't burn API quota.
TTL-expires after 7 days — long enough to absorb repeat searches, short
enough that view counts/rankings don't go stale for long."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel


class CachedVideo(BaseModel):
    videoId: str
    title: str
    channelName: str
    thumbnailUrl: str
    description: str = ""
    publishedAt: str
    url: str
    durationSeconds: int | None = None


class YoutubeCache(Document):
    query: str
    videos: list[CachedVideo] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "youtubecaches"
        indexes = [
            IndexModel([("query", 1)], unique=True),
            IndexModel([("createdAt", 1)], expireAfterSeconds=7 * 24 * 60 * 60),
        ]
