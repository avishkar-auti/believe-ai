"""API-facing shapes for Job Intel — mirrors packages/shared's JobIntel type."""

from __future__ import annotations

from pydantic import BaseModel, Field

from models.job_intel import ParsingConfidence
from schemas.ai import CompanyIntelResult


class JobIntelDto(BaseModel):
    id: str
    userId: str
    jobUrl: str
    company: str
    roleTitle: str
    skills: list[str]
    experienceLevel: str
    location: str
    hiringTeamNames: list[str]
    atsKeywords: list[str]
    companyIntel: CompanyIntelResult
    parsingConfidence: ParsingConfidence
    createdAt: str


class AnalyzeJobUrlInput(BaseModel):
    jobUrl: str = Field(min_length=1)
