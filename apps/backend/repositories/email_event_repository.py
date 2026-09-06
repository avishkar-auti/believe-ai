"""Beanie-backed access to EmailEvent — the immutable per-recipient
engagement history backing the activity drawer and the engagement-over-time
chart. EmailLog's counters stay the source of truth for current-state
totals; this is only ever appended to, never mutated."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from beanie import PydanticObjectId
from bson import ObjectId

from models.email_event import EmailEvent, EmailEventType


async def record(
    *,
    campaign_id: ObjectId,
    contact_id: ObjectId,
    email_log_id: ObjectId,
    user_id: ObjectId,
    event_type: EmailEventType,
    link_id: ObjectId | None = None,
    metadata: dict | None = None,
) -> EmailEvent:
    event = EmailEvent(
        campaignId=PydanticObjectId(campaign_id),
        contactId=PydanticObjectId(contact_id),
        emailLogId=PydanticObjectId(email_log_id),
        userId=PydanticObjectId(user_id),
        type=event_type,
        linkId=PydanticObjectId(link_id) if link_id else None,
        metadata=metadata or {},
    )
    await event.insert()
    return event


async def was_seen_recently(email_log_id: ObjectId, event_type: EmailEventType, window_seconds: int) -> bool:
    """Debounce guard for pixel/click double-fires (e.g. a mail client's own
    image proxy re-requesting the same pixel within milliseconds) — a repeat
    hit outside the window is genuine renewed engagement and must still count
    as a new event, so this only suppresses near-instant duplicates."""
    cutoff = datetime.now(UTC) - timedelta(seconds=window_seconds)
    recent = await EmailEvent.find_one(
        EmailEvent.emailLogId == email_log_id, EmailEvent.type == event_type, EmailEvent.createdAt >= cutoff
    )
    return recent is not None


async def list_for_email_log(email_log_id: ObjectId) -> list[EmailEvent]:
    return await EmailEvent.find(EmailEvent.emailLogId == email_log_id).sort("+createdAt").to_list()


async def engagement_over_time(campaign_id: ObjectId, event_types: list[EmailEventType]) -> list[dict]:
    """Daily counts per event type, for the engagement-over-time chart."""
    collection = EmailEvent.get_pymongo_collection()
    cursor = await collection.aggregate(
        [
            {"$match": {"campaignId": campaign_id, "type": {"$in": event_types}}},
            {
                "$group": {
                    "_id": {"date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}}, "type": "$type"},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id.date": 1}},
        ]
    )
    return [doc async for doc in cursor]
