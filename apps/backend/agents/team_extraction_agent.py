"""Extracts real, named people (and their titles, if stated) from a company's
own public team/about page — the key-free replacement for a paid LinkedIn
people-search API. Stateless, same shape as company_intel_agent.py."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import TeamExtractionRequest, TeamExtractionResult


async def extract_team_members(settings: Settings, req: TeamExtractionRequest) -> TeamExtractionResult:
    return await with_fallback(settings, "extract_team_members", lambda p: p.extract_team_members(req))
