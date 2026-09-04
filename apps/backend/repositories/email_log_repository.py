"""Beanie-backed email log access — mirrors apps/api's emailLog.repository.ts
query-for-query, including the forward-only engagement funnel guard on
increment_open/increment_click (see the docstrings there)."""

from __future__ import annotations

from datetime import UTC, datetime

from beanie import PydanticObjectId
from bson import ObjectId

from models.email_log import EmailLog, EmailLogStatus

PRE_OPEN_STATUSES = ["QUEUED", "SENT", "DELIVERED"]
PRE_CLICK_STATUSES = [*PRE_OPEN_STATUSES, "OPENED"]


async def insert_many(records: list[EmailLog]) -> list[EmailLog]:
    """Beanie's bulk insert_many converts each document to a plain dict before
    inserting (see its source) — it never writes the generated _id back onto
    the original objects the way a single .insert() does. Without this, every
    record here keeps `id=None` and the caller's later `str(log.id)` (used as
    both the enqueued job's argument and its arq job id) becomes the literal
    string "None" for every recipient, so no queued send can ever resolve
    back to a real EmailLog."""
    if not records:
        return []
    result = await EmailLog.insert_many(records)
    for record, inserted_id in zip(records, result.inserted_ids, strict=True):
        record.id = PydanticObjectId(inserted_id)
    return records


async def find_queued_by_campaign(campaign_id: ObjectId) -> list[EmailLog]:
    return await EmailLog.find(EmailLog.campaignId == campaign_id, EmailLog.status == "QUEUED").to_list()


async def find_by_id(email_log_id: ObjectId) -> EmailLog | None:
    return await EmailLog.get(email_log_id)


async def find_by_tracking_token(token: str) -> EmailLog | None:
    return await EmailLog.find_one(EmailLog.trackingToken == token)


async def find_latest_for_contact(campaign_id: ObjectId, contact_id: ObjectId) -> EmailLog | None:
    return await EmailLog.find(EmailLog.campaignId == campaign_id, EmailLog.contactId == contact_id).sort("-stepIndex").first_or_none()


async def aggregate_by_campaign(campaign_id: ObjectId) -> list[dict]:
    collection = EmailLog.get_pymongo_collection()
    cursor = await collection.aggregate([{"$match": {"campaignId": campaign_id}}, {"$group": {"_id": "$status", "count": {"$sum": 1}}}])
    return [doc async for doc in cursor]


async def list_for_campaign(campaign_id: ObjectId, page: int, limit: int) -> tuple[list[EmailLog], int]:
    skip = (page - 1) * limit
    items = await EmailLog.find(EmailLog.campaignId == campaign_id).sort("-createdAt").skip(skip).limit(limit).to_list()
    total = await EmailLog.find(EmailLog.campaignId == campaign_id).count()
    return items, total


async def list_by_user_id(user_id: ObjectId, page: int, limit: int) -> tuple[list[dict], int]:
    """Cross-campaign delivery/engagement view, newest first, with campaign/contact names joined in."""
    skip = (page - 1) * limit
    collection = EmailLog.get_pymongo_collection()
    match = {"userId": user_id}

    rows_cursor = await collection.aggregate(
        [
            {"$match": match},
            {"$sort": {"createdAt": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {"$lookup": {"from": "campaigns", "localField": "campaignId", "foreignField": "_id", "as": "campaign"}},
            {"$lookup": {"from": "contacts", "localField": "contactId", "foreignField": "_id", "as": "contact"}},
            {"$unwind": "$campaign"},
            {"$unwind": "$contact"},
            {
                "$project": {
                    "campaignId": 1,
                    "contactId": 1,
                    "userId": 1,
                    "stepIndex": 1,
                    "status": 1,
                    "providerMessageId": 1,
                    "trackingToken": 1,
                    "openCount": 1,
                    "clickCount": 1,
                    "replied": 1,
                    "errorMessage": 1,
                    "sentAt": 1,
                    "openedAt": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "campaignName": "$campaign.name",
                    "contactName": {"$trim": {"input": {"$concat": ["$contact.firstName", " ", {"$ifNull": ["$contact.lastName", ""]}]}}},
                    "contactEmail": "$contact.email",
                }
            },
        ]
    )
    rows = [doc async for doc in rows_cursor]

    count_cursor = await collection.aggregate([{"$match": match}, {"$count": "count"}])
    count_rows = [doc async for doc in count_cursor]
    total = count_rows[0]["count"] if count_rows else 0

    return rows, total


async def increment_open(tracking_token: str) -> None:
    collection = EmailLog.get_pymongo_collection()
    pipeline = [
        {
            "$set": {
                "openCount": {"$add": ["$openCount", 1]},
                # First open is the meaningful one; later re-fetches must not overwrite it.
                "openedAt": {"$ifNull": ["$openedAt", datetime.now(UTC)]},
                "status": {"$cond": [{"$in": ["$status", PRE_OPEN_STATUSES]}, "OPENED", "$status"]},
            }
        }
    ]
    await collection.update_one({"trackingToken": tracking_token}, pipeline)


async def increment_click(tracking_token: str) -> None:
    collection = EmailLog.get_pymongo_collection()
    pipeline = [
        {
            "$set": {
                "clickCount": {"$add": ["$clickCount", 1]},
                # A click proves the message was opened, even if the pixel was blocked.
                "openedAt": {"$ifNull": ["$openedAt", datetime.now(UTC)]},
                "status": {"$cond": [{"$in": ["$status", PRE_CLICK_STATUSES]}, "CLICKED", "$status"]},
            }
        }
    ]
    await collection.update_one({"trackingToken": tracking_token}, pipeline)


async def mark_replied(email_log_id: ObjectId) -> EmailLog | None:
    doc = await EmailLog.get(email_log_id)
    if not doc:
        return None
    doc.replied = True
    doc.status = "REPLIED"
    await doc.save()
    return doc


async def set_status(
    email_log_id: PydanticObjectId,
    status: EmailLogStatus,
    *,
    provider_message_id: str | None = None,
    error_message: str | None = None,
    sent_at: datetime | None = None,
) -> None:
    doc = await EmailLog.get(email_log_id)
    if not doc:
        return
    doc.status = status
    if provider_message_id is not None:
        doc.providerMessageId = provider_message_id
    if error_message is not None:
        doc.errorMessage = error_message
    if sent_at is not None:
        doc.sentAt = sent_at
    await doc.save()


async def count_sent_since(user_id: ObjectId, since: datetime) -> int:
    return await EmailLog.find({"userId": user_id, "sentAt": {"$gte": since}}).count()
