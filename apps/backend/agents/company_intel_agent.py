"""Synthesizes structured company intel (funding, tech stack, hiring trend)
from real public snippets Node already fetched. Stateless — no resume or
other stored data involved, same shape as job_post_agent.py."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import CompanyIntelRequest, CompanyIntelResult


async def synthesize_company_intel(settings: Settings, req: CompanyIntelRequest) -> CompanyIntelResult:
    return await with_fallback(settings, "synthesize_company_intel", lambda p: p.synthesize_company_intel(req))
