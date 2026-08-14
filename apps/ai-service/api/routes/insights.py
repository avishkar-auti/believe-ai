from fastapi import APIRouter

from agents.insights_agent import analyze_campaign
from api.dependencies import AuthorizedDep, SettingsDep
from schemas.ai import AiCampaignInsightRequest, AiCampaignInsightResult

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/campaign-insights", response_model=AiCampaignInsightResult)
async def analyze_campaign_route(
    body: AiCampaignInsightRequest, settings: SettingsDep, _caller: AuthorizedDep
) -> AiCampaignInsightResult:
    return await analyze_campaign(settings, body)
