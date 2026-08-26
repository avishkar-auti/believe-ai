"""Mirrors apps/api's analytics.routes.ts."""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep
from schemas.analytics import DashboardStats, EmailTrackingEntry
from schemas.campaign import CampaignAnalytics
from schemas.pagination import PaginatedResult
from services import analytics_service
from services.campaign_service import get_analytics

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard_route(mongo_user_id: MongoUserIdDep) -> DashboardStats:
    return await analytics_service.get_dashboard(mongo_user_id)


@router.get("/campaigns/{campaign_id}", response_model=CampaignAnalytics)
async def campaign_analytics_route(campaign_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> CampaignAnalytics:
    return await get_analytics(campaign_id, mongo_user_id)


@router.get("/emails", response_model=PaginatedResult[EmailTrackingEntry])
async def emails_route(
    mongo_user_id: MongoUserIdDep, page: int | None = None, limit: int | None = None
) -> PaginatedResult[EmailTrackingEntry]:
    return await analytics_service.get_email_tracking(mongo_user_id, page, limit)
