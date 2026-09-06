"""Real-data campaign insights: aggregates actual EmailLog counts (mirrors
campaign.service.ts's getAnalytics on the Node side) and hands only the
rollup numbers to the insights agent — never per-recipient data.
"""

from __future__ import annotations

from bson import ObjectId

from agents.insights_agent import analyze_campaign
from core.config import Settings
from core.errors import NotFoundError
from repositories import campaign_repository, email_log_repository
from schemas.ai import AiCampaignInsightRequest, AiCampaignInsightResult


def _rate(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 1000) / 10


async def get_campaign_insights(
    settings: Settings, user_id: ObjectId, campaign_id: ObjectId
) -> AiCampaignInsightResult:
    campaign = await campaign_repository.find_by_id(campaign_id, user_id)
    if not campaign:
        raise NotFoundError("Campaign not found")

    rows = await email_log_repository.aggregate_by_campaign(campaign_id)
    counts: dict[str, int] = {row["_id"]: row["count"] for row in rows}
    sent = sum(counts.get(s, 0) for s in ("SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED"))
    opened = sum(counts.get(s, 0) for s in ("OPENED", "CLICKED", "REPLIED"))
    clicked = sum(counts.get(s, 0) for s in ("CLICKED", "REPLIED"))
    replied = counts.get("REPLIED", 0)
    bounced = counts.get("BOUNCED", 0)

    req = AiCampaignInsightRequest(
        campaignName=campaign.name,
        sent=sent,
        openRate=_rate(opened, sent),
        clickRate=_rate(clicked, sent),
        replyRate=_rate(replied, sent),
        bounceRate=_rate(bounced, sent),
    )
    return await analyze_campaign(settings, req)
