"""The outreach dashboard — mirrors apps/api's analytics.service.ts."""

from __future__ import annotations

import asyncio

from bson import ObjectId

from repositories import analytics_repository, email_log_repository
from schemas.analytics import DashboardStats, EmailTrackingEntry
from schemas.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PaginatedResult, total_pages
from services.campaign_service import list_campaigns

_SENT_LIKE_STATUSES = ("SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED")
_OPENED_LIKE_STATUSES = ("OPENED", "CLICKED", "REPLIED")
_CLICKED_LIKE_STATUSES = ("CLICKED", "REPLIED")


def _rate(numerator: int, denominator: int) -> float:
    return round((numerator / denominator) * 1000) / 10 if denominator > 0 else 0.0


def _to_tracking_dto(row: dict) -> EmailTrackingEntry:
    return EmailTrackingEntry(
        id=str(row["_id"]),
        campaignId=str(row["campaignId"]),
        contactId=str(row["contactId"]),
        userId=str(row["userId"]),
        stepIndex=row["stepIndex"],
        status=row["status"],
        providerMessageId=row.get("providerMessageId"),
        trackingToken=row["trackingToken"],
        openCount=row["openCount"],
        clickCount=row["clickCount"],
        replied=row["replied"],
        errorMessage=row.get("errorMessage"),
        sentAt=row["sentAt"].isoformat() if row.get("sentAt") else None,
        openedAt=row["openedAt"].isoformat() if row.get("openedAt") else None,
        createdAt=row["createdAt"].isoformat(),
        updatedAt=row["updatedAt"].isoformat(),
        campaignName=row["campaignName"],
        contactName=row["contactName"],
        contactEmail=row["contactEmail"],
    )


async def get_dashboard(user_id: ObjectId) -> DashboardStats:
    (total_contacts, active_campaigns, scheduled_campaigns, counts), recent_campaigns = await asyncio.gather(
        analytics_repository.dashboard_counts(user_id), list_campaigns(user_id)
    )

    emails_sent = sum(counts.get(s, 0) for s in _SENT_LIKE_STATUSES)
    opened = sum(counts.get(s, 0) for s in _OPENED_LIKE_STATUSES)
    clicked = sum(counts.get(s, 0) for s in _CLICKED_LIKE_STATUSES)
    replied = counts.get("REPLIED", 0)

    return DashboardStats(
        totalContacts=total_contacts,
        emailsSent=emails_sent,
        emailsDelivered=emails_sent,
        openRate=_rate(opened, emails_sent),
        clickRate=_rate(clicked, emails_sent),
        replyRate=_rate(replied, emails_sent),
        activeCampaigns=active_campaigns,
        scheduledCampaigns=scheduled_campaigns,
        recentCampaigns=recent_campaigns[:5],
    )


async def get_email_tracking(user_id: ObjectId, page: int | None, limit: int | None) -> PaginatedResult[EmailTrackingEntry]:
    page_num = max(1, page or 1)
    limit_num = min(MAX_PAGE_SIZE, max(1, limit or DEFAULT_PAGE_SIZE))

    rows, total = await email_log_repository.list_by_user_id(user_id, page_num, limit_num)

    return PaginatedResult(
        items=[_to_tracking_dto(row) for row in rows],
        page=page_num,
        limit=limit_num,
        total=total,
        totalPages=total_pages(total, limit_num),
    )
