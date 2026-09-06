"""Beanie-backed email log access — mirrors apps/api's emailLog.repository.ts
query-for-query, including the forward-only engagement funnel guard on
increment_open/increment_click (see the docstrings there)."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Literal

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


async def increment_open(tracking_token: str) -> EmailLog | None:
    """Returns the post-update document (None if the token doesn't match any
    log) so the caller can decide event-history/debounce handling without a
    second round-trip."""
    collection = EmailLog.get_pymongo_collection()
    now = datetime.now(UTC)
    pipeline = [
        {
            "$set": {
                "openCount": {"$add": ["$openCount", 1]},
                "opened": True,
                # First open is the meaningful one for `openedAt`; later
                # re-fetches must not overwrite it. `lastOpenedAt` always
                # advances — that's what distinguishes a stale vs fresh look.
                "openedAt": {"$ifNull": ["$openedAt", now]},
                "lastOpenedAt": now,
                "lastActivityAt": now,
                "status": {"$cond": [{"$in": ["$status", PRE_OPEN_STATUSES]}, "OPENED", "$status"]},
            }
        }
    ]
    update_result = await collection.update_one({"trackingToken": tracking_token}, pipeline)
    if update_result.matched_count == 0:
        return None
    return await find_by_tracking_token(tracking_token)


async def increment_click(tracking_token: str) -> EmailLog | None:
    collection = EmailLog.get_pymongo_collection()
    now = datetime.now(UTC)
    pipeline = [
        {
            "$set": {
                "clickCount": {"$add": ["$clickCount", 1]},
                "clicked": True,
                "firstClickedAt": {"$ifNull": ["$firstClickedAt", now]},
                "lastClickedAt": now,
                # A click proves the message was opened, even if the pixel was blocked.
                "opened": True,
                "openedAt": {"$ifNull": ["$openedAt", now]},
                "lastOpenedAt": {"$ifNull": ["$lastOpenedAt", now]},
                "lastActivityAt": now,
                "status": {"$cond": [{"$in": ["$status", PRE_CLICK_STATUSES]}, "CLICKED", "$status"]},
            }
        }
    ]
    update_result = await collection.update_one({"trackingToken": tracking_token}, pipeline)
    if update_result.matched_count == 0:
        return None
    return await find_by_tracking_token(tracking_token)


async def mark_replied(email_log_id: ObjectId) -> EmailLog | None:
    doc = await EmailLog.get(email_log_id)
    if not doc:
        return None
    now = datetime.now(UTC)
    doc.replied = True
    doc.replyCount += 1
    doc.firstRepliedAt = doc.firstRepliedAt or now
    doc.lastRepliedAt = now
    doc.lastActivityAt = now
    doc.status = "REPLIED"
    await doc.save()
    return doc


async def mark_bounced(email_log_id: ObjectId, reason: str | None = None) -> EmailLog | None:
    """No provider webhook feeds this today (see models/email_log.py) — this
    exists as the seam for one, and for an honest manual override, never for
    inferring a bounce from silence."""
    doc = await EmailLog.get(email_log_id)
    if not doc:
        return None
    doc.bounced = True
    doc.bouncedAt = datetime.now(UTC)
    doc.bounceReason = reason
    doc.status = "BOUNCED"
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


async def set_thread_info(
    email_log_id: PydanticObjectId,
    *,
    thread_id: str | None = None,
    conversation_id: str | None = None,
    internet_message_id: str | None = None,
) -> None:
    """Best-effort provider thread/message identifiers, captured at send time
    when the provider's response includes them — the seam reply-correlation
    can use instead of guessing from the subject line."""
    updates: dict[str, str] = {}
    if thread_id:
        updates["threadId"] = thread_id
    if conversation_id:
        updates["conversationId"] = conversation_id
    if internet_message_id:
        updates["internetMessageId"] = internet_message_id
    if not updates:
        return
    collection = EmailLog.get_pymongo_collection()
    await collection.update_one({"_id": email_log_id}, {"$set": updates})


_TERMINAL_SENT_STATUSES = ("SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED")


async def aggregate_engagement_by_campaign(campaign_id: ObjectId) -> dict[str, int]:
    """Independent-flag rollup — the source of truth for analytics, unlike
    the single `status` field's mutually-exclusive counts.

    `opened`/`clicked` fall back to `status` for records written before these
    boolean flags existed — otherwise a real historical open/click recorded
    under the old status-only tracking would silently read as 0 here."""
    collection = EmailLog.get_pymongo_collection()
    opened_or_legacy_status = {"$or": ["$opened", {"$in": ["$status", ["OPENED", "CLICKED", "REPLIED"]]}]}
    clicked_or_legacy_status = {"$or": ["$clicked", {"$in": ["$status", ["CLICKED", "REPLIED"]]}]}
    cursor = await collection.aggregate(
        [
            {"$match": {"campaignId": campaign_id}},
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "sent": {"$sum": {"$cond": [{"$in": ["$status", [*_TERMINAL_SENT_STATUSES]]}, 1, 0]}},
                    "uniqueOpened": {"$sum": {"$cond": [opened_or_legacy_status, 1, 0]}},
                    "totalOpens": {"$sum": "$openCount"},
                    "uniqueClicked": {"$sum": {"$cond": [clicked_or_legacy_status, 1, 0]}},
                    "totalClicks": {"$sum": "$clickCount"},
                    "replied": {"$sum": {"$cond": ["$replied", 1, 0]}},
                    "bounced": {"$sum": {"$cond": ["$bounced", 1, 0]}},
                    "failed": {"$sum": {"$cond": [{"$eq": ["$status", "FAILED"]}, 1, 0]}},
                    "unsubscribed": {"$sum": {"$cond": ["$unsubscribed", 1, 0]}},
                }
            },
        ]
    )
    rows = [doc async for doc in cursor]
    if not rows:
        return {
            "total": 0,
            "sent": 0,
            "uniqueOpened": 0,
            "totalOpens": 0,
            "uniqueClicked": 0,
            "totalClicks": 0,
            "replied": 0,
            "bounced": 0,
            "failed": 0,
            "unsubscribed": 0,
        }
    row = rows[0]
    row.pop("_id", None)
    return row


RecipientSegment = Literal["opened_no_reply", "clicked_no_reply", "high_engagement_no_reply"]

_HIGH_ENGAGEMENT_OPEN_THRESHOLD = 3
_HIGH_ENGAGEMENT_CLICK_THRESHOLD = 2

_OPENED_OR_LEGACY_STATUS = {"$or": [{"opened": True}, {"status": {"$in": ["OPENED", "CLICKED", "REPLIED"]}}]}
_CLICKED_OR_LEGACY_STATUS = {"$or": [{"clicked": True}, {"status": {"$in": ["CLICKED", "REPLIED"]}}]}

# `opened`/`clicked` fall back to `status` here too — matching
# aggregate_engagement_by_campaign's backward-compatibility note above, so a
# pre-migration record that was genuinely opened/clicked shows up in these
# segments instead of only in newly-tracked ones.
_SEGMENT_FILTERS: dict[RecipientSegment, dict] = {
    "opened_no_reply": {"$and": [_OPENED_OR_LEGACY_STATUS, {"replied": False}]},
    "clicked_no_reply": {"$and": [_CLICKED_OR_LEGACY_STATUS, {"replied": False}]},
    "high_engagement_no_reply": {
        "replied": False,
        "$or": [{"openCount": {"$gte": _HIGH_ENGAGEMENT_OPEN_THRESHOLD}}, {"clickCount": {"$gte": _HIGH_ENGAGEMENT_CLICK_THRESHOLD}}],
    },
}


async def list_for_campaign_filtered(
    campaign_id: ObjectId,
    page: int,
    limit: int,
    *,
    status: EmailLogStatus | None = None,
    segment: RecipientSegment | None = None,
    search: str | None = None,
) -> tuple[list[dict], int]:
    """Same joined shape as list_by_user_id, scoped to one campaign, with
    optional status/segment/contact-name-or-email filtering for the
    recipient table's filter bar."""
    skip = (page - 1) * limit
    collection = EmailLog.get_pymongo_collection()
    match: dict = {"campaignId": campaign_id}
    if status:
        match["status"] = status
    if segment:
        match.update(_SEGMENT_FILTERS[segment])

    pipeline: list[dict] = [
        {"$match": match},
        {"$lookup": {"from": "contacts", "localField": "contactId", "foreignField": "_id", "as": "contact"}},
        {"$unwind": "$contact"},
    ]
    if search:
        pattern = re.escape(search.strip())
        pipeline.append(
            {
                "$match": {
                    "$or": [
                        {"contact.firstName": {"$regex": pattern, "$options": "i"}},
                        {"contact.lastName": {"$regex": pattern, "$options": "i"}},
                        {"contact.email": {"$regex": pattern, "$options": "i"}},
                        {"contact.company": {"$regex": pattern, "$options": "i"}},
                    ]
                }
            }
        )

    count_cursor = await collection.aggregate([*pipeline, {"$count": "count"}])
    count_rows = [doc async for doc in count_cursor]
    total = count_rows[0]["count"] if count_rows else 0

    pipeline += [
        {"$sort": {"lastActivityAt": -1, "createdAt": -1}},
        {"$skip": skip},
        {"$limit": limit},
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
                "opened": 1,
                "lastOpenedAt": 1,
                "clicked": 1,
                "firstClickedAt": 1,
                "lastClickedAt": 1,
                "replied": 1,
                "replyCount": 1,
                "firstRepliedAt": 1,
                "lastRepliedAt": 1,
                "bounced": 1,
                "bouncedAt": 1,
                "bounceReason": 1,
                "unsubscribed": 1,
                "lastActivityAt": 1,
                "errorMessage": 1,
                "sentAt": 1,
                "openedAt": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "contactName": {"$trim": {"input": {"$concat": ["$contact.firstName", " ", {"$ifNull": ["$contact.lastName", ""]}]}}},
                "contactEmail": "$contact.email",
                "contactCompany": "$contact.company",
            }
        },
    ]
    rows = [doc async for doc in await collection.aggregate(pipeline)]
    return rows, total
