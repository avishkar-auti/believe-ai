"""Mirrors packages/server/src/models/JobIntel.model.ts — same "jobintels"
collection. One document per analyzed job posting, the first stage of the
Job Outreach pipeline."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

from schemas.ai import CompanyIntelResult

ParsingConfidence = Literal["high", "low"]


class JobIntel(Document):
    userId: PydanticObjectId
    jobUrl: str
    company: str
    roleTitle: str
    skills: list[str] = Field(default_factory=list)
    experienceLevel: str = "Not specified"
    location: str = "Not specified"
    hiringTeamNames: list[str] = Field(default_factory=list)
    atsKeywords: list[str] = Field(default_factory=list)
    companyIntel: CompanyIntelResult
    parsingConfidence: ParsingConfidence = "low"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "jobintels"
        indexes = [IndexModel([("userId", 1), ("createdAt", -1)])]
