"""Aggregate counts backing the outreach dashboard — mirrors apps/api's
analytics.repository.ts."""

from __future__ import annotations

from bson import ObjectId

from models.campaign import Campaign
from models.contact import Contact
from models.email_log import EmailLog


async def dashboard_counts(user_id: ObjectId) -> tuple[int, int, int, dict[str, int]]:
    total_contacts = await Contact.find(Contact.userId == user_id).count()
    active_campaigns = await Campaign.find(Campaign.userId == user_id, Campaign.status == "RUNNING").count()
    scheduled_campaigns = await Campaign.find(Campaign.userId == user_id, Campaign.status == "SCHEDULED").count()

    rows = await EmailLog.aggregate(
        [{"$match": {"userId": user_id}}, {"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    ).to_list()
    status_counts = {row["_id"]: row["count"] for row in rows}

    return total_contacts, active_campaigns, scheduled_campaigns, status_counts
