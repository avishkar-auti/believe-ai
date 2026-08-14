"""Generates cold email + LinkedIn note + (optionally) a cover letter in one
call, grounded in a hook Node already computed deterministically. Stateless
— same shape as job_post_agent.py."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import OutreachDraftRequest, OutreachDraftResult


async def generate_outreach_draft(settings: Settings, req: OutreachDraftRequest) -> OutreachDraftResult:
    return await with_fallback(settings, "generate_outreach_draft", lambda p: p.generate_outreach_draft(req))
