"""Beanie-backed outreach follow-up access — mirrors apps/api's outreachFollowUp.repository.ts."""

from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from models.outreach_follow_up import OutreachFollowUp

MAX_FOLLOW_UPS = 3


async def create(
    user_id: ObjectId, outreach_draft_id: ObjectId, contact_id: ObjectId, sequence_number: int, scheduled_for: datetime
) -> OutreachFollowUp:
    if sequence_number > MAX_FOLLOW_UPS:
        raise ValueError(f"Refusing to schedule follow-up #{sequence_number} — cap is {MAX_FOLLOW_UPS}")
    doc = OutreachFollowUp(
        userId=user_id,
        outreachDraftId=outreach_draft_id,
        contactId=contact_id,
        sequenceNumber=sequence_number,
        scheduledFor=scheduled_for,
    )
    await doc.insert()
    return doc


async def list_by_draft(outreach_draft_id: ObjectId, user_id: ObjectId) -> list[OutreachFollowUp]:
    return (
        await OutreachFollowUp.find(OutreachFollowUp.outreachDraftId == outreach_draft_id, OutreachFollowUp.userId == user_id)
        .sort("sequenceNumber")
        .to_list()
    )


async def find_by_id(follow_up_id: ObjectId) -> OutreachFollowUp | None:
    return await OutreachFollowUp.get(follow_up_id)


async def cancel_pending(outreach_draft_id: ObjectId, user_id: ObjectId, reason: str) -> None:
    """Cancels every not-yet-sent follow-up in a contact's sequence — the
    enforcement point for "a reply stops all remaining sends."."""
    collection = OutreachFollowUp.get_pymongo_collection()
    await collection.update_many(
        {"outreachDraftId": outreach_draft_id, "userId": user_id, "sent": False, "cancelled": False},
        {"$set": {"cancelled": True, "cancelReason": reason}},
    )


async def mark_sent(follow_up_id: ObjectId) -> None:
    doc = await OutreachFollowUp.get(follow_up_id)
    if not doc:
        return
    doc.sent = True
    await doc.save()
