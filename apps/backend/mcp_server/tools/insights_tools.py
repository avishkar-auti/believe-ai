from __future__ import annotations

from agents.insights_agent import analyze_campaign
from core.config import get_settings
from mcp_server.registry import server
from schemas.ai import AiCampaignInsightRequest


@server.tool()
async def analyze_campaign_performance(
    campaign_name: str,
    sent: int,
    open_rate: float,
    click_rate: float,
    reply_rate: float,
    bounce_rate: float,
) -> dict:
    """Analyze a campaign's aggregate performance and return a summary plus
    what worked / what to improve. Only ever sees rollup numbers, never
    per-recipient data.
    """
    settings = get_settings()
    req = AiCampaignInsightRequest(
        campaignName=campaign_name,
        sent=sent,
        openRate=open_rate,
        clickRate=click_rate,
        replyRate=reply_rate,
        bounceRate=bounce_rate,
    )
    result = await analyze_campaign(settings, req)
    return result.model_dump()
