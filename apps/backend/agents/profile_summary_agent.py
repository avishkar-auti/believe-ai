"""Believe Identity's "Generate with Believe AI" button — one grounded
one-line summary from what the user has already told the app about
themselves. Stateless, same shape as job_post_agent.py."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import ProfileSummaryRequest, ProfileSummaryResult


async def generate_profile_summary(settings: Settings, req: ProfileSummaryRequest) -> ProfileSummaryResult:
    return await with_fallback(settings, "generate_profile_summary", lambda p: p.generate_profile_summary(req))
