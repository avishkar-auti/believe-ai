"""Caches team-page extraction results (name/title pairs pulled from a
company's own public team/about page) by company, so repeated lead discovery
for the same company doesn't re-fetch and re-run the LLM extraction every
time. 7-day TTL via a Mongo expiry index, same pattern as YoutubeCache."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel


class TeamMemberEntry(BaseModel):
    name: str
    title: str | None = None


class CompanyTeamCache(Document):
    company: str
    members: list[TeamMemberEntry] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "companyteamcaches"
        indexes = [
            IndexModel([("company", 1)], unique=True),
            IndexModel([("createdAt", 1)], expireAfterSeconds=7 * 24 * 60 * 60),
        ]
