"""Real-data routes: operate on a caller's own stored campaigns/contacts by
id, rather than requiring the request body to carry all the data.

Also mirrors apps/api's campaign.routes.ts CRUD + state-machine surface
(list/create/get/update/pause/cancel/analytics/recipients/mark-replied).
POST /{id}/launch and /{id}/resume are added in Phase 4e once the arq send
queue exists — both enqueue send jobs, everything here does not.
"""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, SettingsDep, UserIdDep
from models.campaign import CampaignStatus
from models.email_log import EmailLogStatus
from repositories.email_log_repository import RecipientSegment
from schemas.ai import AiCampaignInsightResult, AiEmailGenerationResult, AiPersonalizeResult
from schemas.campaign import (
    CampaignAnalytics,
    CampaignDto,
    CampaignLinkDto,
    CreateCampaignInput,
    EmailEventDto,
    EmailLogDto,
    EngagementTimeseriesPoint,
    InsightActionCardDto,
    ProjectEngagementDto,
    UpdateCampaignInput,
)
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from services import audit_service, campaign_service
from services.campaign_insights_service import get_campaign_insights
from services.personalize_contact_service import personalize_for_contact
from utils.object_id import parse_object_id

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("/", response_model=list[CampaignDto])
async def list_campaigns_route(
    mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, status: CampaignStatus | None = None
) -> list[CampaignDto]:
    return await campaign_service.list_campaigns(mongo_user_id, status)


@router.post("/", response_model=CampaignDto, status_code=201)
async def create_campaign_route(body: CreateCampaignInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> CampaignDto:
    campaign = await campaign_service.create(mongo_user_id, body)
    await audit_service.record(
        mongo_user_id,
        "campaign.created",
        "campaign",
        entity_id=campaign.id,
        metadata={"name": campaign.name, "audienceSize": len(campaign.audienceContactIds)},
    )
    return campaign


@router.get("/{campaign_id}/insights", response_model=AiCampaignInsightResult)
async def campaign_insights_route(
    campaign_id: str, settings: SettingsDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> AiCampaignInsightResult:
    return await get_campaign_insights(settings, mongo_user_id, parse_object_id(campaign_id, "campaign_id"))


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


@router.post("/{campaign_id}/launch", response_model=CampaignDto)
async def launch_campaign_route(
    campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> CampaignDto:
    campaign = await campaign_service.launch(campaign_id, mongo_user_id)
    await audit_service.record(
        mongo_user_id,
        "campaign.launched",
        "campaign",
        entity_id=campaign.id,
        metadata={"name": campaign.name, "status": campaign.status},
    )
    return campaign


@router.post("/{campaign_id}/resume", response_model=CampaignDto)
async def resume_campaign_route(
    campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> CampaignDto:
    campaign = await campaign_service.resume(campaign_id, mongo_user_id)
    await audit_service.record(
        mongo_user_id, "campaign.resumed", "campaign", entity_id=campaign.id, metadata={"name": campaign.name}
    )
    return campaign


@router.post("/{campaign_id}/pause", response_model=CampaignDto)
async def pause_campaign_route(campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> CampaignDto:
    campaign = await campaign_service.pause(campaign_id, mongo_user_id)
    await audit_service.record(mongo_user_id, "campaign.paused", "campaign", entity_id=campaign.id, metadata={"name": campaign.name})
    return campaign


@router.post("/{campaign_id}/cancel", response_model=CampaignDto)
async def cancel_campaign_route(campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> CampaignDto:
    campaign = await campaign_service.cancel(campaign_id, mongo_user_id)
    await audit_service.record(mongo_user_id, "campaign.cancelled", "campaign", entity_id=campaign.id, metadata={"name": campaign.name})
    return campaign


@router.get("/{campaign_id}/analytics", response_model=CampaignAnalytics)
async def campaign_analytics_route(campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> CampaignAnalytics:
    return await campaign_service.get_analytics(campaign_id, mongo_user_id)


@router.get("/{campaign_id}/recipients", response_model=PaginatedResult[EmailLogDto])
async def campaign_recipients_route(
    campaign_id: PydanticObjectId,
    mongo_user_id: MongoUserIdDep,
    _user_id: UserIdDep,
    page: int = 1,
    limit: int = DEFAULT_PAGE_SIZE,
    status: EmailLogStatus | None = None,
    segment: RecipientSegment | None = None,
    search: str | None = None,
) -> PaginatedResult[EmailLogDto]:
    return await campaign_service.list_recipients(campaign_id, mongo_user_id, page, limit, status=status, segment=segment, search=search)


@router.get("/{campaign_id}/recipients/{contact_id}/timeline", response_model=list[EmailEventDto])
async def recipient_timeline_route(
    campaign_id: PydanticObjectId, contact_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> list[EmailEventDto]:
    return await campaign_service.get_recipient_timeline(campaign_id, contact_id, mongo_user_id)


@router.post("/{campaign_id}/recipients/{contact_id}/mark-replied")
async def mark_replied_route(
    campaign_id: PydanticObjectId, contact_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> dict[str, bool]:
    await campaign_service.mark_replied(campaign_id, contact_id, mongo_user_id)
    return {"marked": True}


@router.get("/{campaign_id}/links", response_model=list[CampaignLinkDto])
async def campaign_links_route(campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> list[CampaignLinkDto]:
    return await campaign_service.get_campaign_links(campaign_id, mongo_user_id)


@router.get("/{campaign_id}/engagement-timeseries", response_model=list[EngagementTimeseriesPoint])
async def campaign_engagement_timeseries_route(
    campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> list[EngagementTimeseriesPoint]:
    return await campaign_service.get_engagement_timeseries(campaign_id, mongo_user_id)


@router.get("/{campaign_id}/projects", response_model=list[ProjectEngagementDto])
async def campaign_projects_route(
    campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> list[ProjectEngagementDto]:
    return await campaign_service.get_top_projects(campaign_id, mongo_user_id)


@router.get("/{campaign_id}/insight-cards", response_model=list[InsightActionCardDto])
async def campaign_insight_cards_route(
    campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> list[InsightActionCardDto]:
    return await campaign_service.get_insight_action_cards(campaign_id, mongo_user_id)


@router.post("/{campaign_id}/generate-follow-up", response_model=AiEmailGenerationResult)
async def campaign_generate_follow_up_route(
    campaign_id: PydanticObjectId, settings: SettingsDep, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> AiEmailGenerationResult:
    return await campaign_service.generate_follow_up_draft(settings, campaign_id, mongo_user_id)


@router.get("/{campaign_id}", response_model=CampaignDto)
async def get_campaign_route(campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> CampaignDto:
    return await campaign_service.get_by_id(campaign_id, mongo_user_id)


@router.patch("/{campaign_id}", response_model=CampaignDto)
async def update_campaign_route(
    campaign_id: PydanticObjectId, body: UpdateCampaignInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> CampaignDto:
    return await campaign_service.update(campaign_id, mongo_user_id, body)


@router.delete("/{campaign_id}")
async def delete_campaign_route(
    campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> dict[str, bool]:
    await campaign_service.delete(campaign_id, mongo_user_id)
    await audit_service.record(mongo_user_id, "campaign.deleted", "campaign", entity_id=str(campaign_id))
    return {"deleted": True}
