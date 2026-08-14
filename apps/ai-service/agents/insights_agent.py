"""Analyzes aggregate campaign performance — only ever sees rollup numbers,
never per-recipient data, so it can't leak individual recipient behavior
(spec 5.17)."""

from __future__ import annotations

from core.config import Settings
from providers.registry import with_fallback
from schemas.ai import AiCampaignInsightRequest, AiCampaignInsightResult


async def analyze_campaign(settings: Settings, req: AiCampaignInsightRequest) -> AiCampaignInsightResult:
    return await with_fallback(settings, "analyze_campaign", lambda p: p.analyze_campaign(req))
