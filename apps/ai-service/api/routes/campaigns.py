"""Real-data routes: operate on a caller's own stored campaigns/contacts by
id, rather than requiring the request body to carry all the data."""

from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, SettingsDep, UserIdDep
from schemas.ai import AiCampaignInsightResult, AiPersonalizeResult
from services.campaign_insights_service import get_campaign_insights
from services.personalize_contact_service import personalize_for_contact
from utils.object_id import parse_object_id

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("/{campaign_id}/insights", response_model=AiCampaignInsightResult)
async def campaign_insights_route(
    campaign_id: str, settings: SettingsDep, db: DbDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> AiCampaignInsightResult:
    return await get_campaign_insights(settings, db, mongo_user_id, parse_object_id(campaign_id, "campaign_id"))


@router.post("/{campaign_id}/contacts/{contact_id}/personalize", response_model=AiPersonalizeResult)
async def personalize_contact_route(
    campaign_id: str,
    contact_id: str,
    settings: SettingsDep,
    db: DbDep,
    mongo_user_id: MongoUserIdDep,
    _user_id: UserIdDep,
) -> AiPersonalizeResult:
    return await personalize_for_contact(
        settings,
        db,
        mongo_user_id,
        parse_object_id(campaign_id, "campaign_id"),
        parse_object_id(contact_id, "contact_id"),
    )
