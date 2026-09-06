"""Open/click tracking and email-link unsubscribe — mirrors apps/api's
tracking.service.ts. Best-effort: many email clients block or proxy pixels,
so these calls never fail loudly, they just record what they can."""

from __future__ import annotations

from bson import ObjectId

from core.errors import NotFoundError
from models.email_log import EmailLog
from repositories import campaign_link_repository, contact_repository, email_event_repository, email_log_repository, unsubscribe_repository

# A pixel or link can legitimately be re-requested within milliseconds by a
# mail client's own image proxy (Gmail/Outlook both do this) — that must not
# double-count as two separate opens in the history timeline. A repeat visit
# outside this window is genuine renewed engagement and is always recorded.
_DUPLICATE_EVENT_WINDOW_SECONDS = 5


async def record_open(token: str) -> None:
    log = await email_log_repository.increment_open(token)
    if not log or not log.id:
        return
    if await email_event_repository.was_seen_recently(log.id, "OPENED", _DUPLICATE_EVENT_WINDOW_SECONDS):
        return
    await email_event_repository.record(
        campaign_id=log.campaignId, contact_id=log.contactId, email_log_id=log.id, user_id=log.userId, event_type="OPENED"
    )


async def record_click(token: str, link_id: str | None = None) -> None:
    log = await email_log_repository.increment_click(token)
    if not log or not log.id:
        return

    resolved_link_id: ObjectId | None = None
    if link_id:
        try:
            candidate = ObjectId(link_id)
        except Exception:  # noqa: BLE001 — an unrecognized/tampered `l` just means no attribution, not an error
            candidate = None
        if candidate:
            link = await campaign_link_repository.find_by_id(candidate)
            # Only trust a link id that actually belongs to this recipient's
            # campaign — `l` is an unsigned hint (see core/link_signing.py).
            if link and link.campaignId == log.campaignId:
                resolved_link_id = candidate
                await campaign_link_repository.increment_click(candidate)

    if await email_event_repository.was_seen_recently(log.id, "CLICKED", _DUPLICATE_EVENT_WINDOW_SECONDS):
        return
    await email_event_repository.record(
        campaign_id=log.campaignId,
        contact_id=log.contactId,
        email_log_id=log.id,
        user_id=log.userId,
        event_type="CLICKED",
        link_id=resolved_link_id,
    )


async def unsubscribe_by_token(token: str) -> None:
    log = await email_log_repository.find_by_tracking_token(token)
    if not log:
        raise NotFoundError("Invalid or expired unsubscribe link")

    contact = await contact_repository.find_by_id(log.contactId, log.userId)
    if not contact or not contact.id:
        return

    await contact_repository.update(contact.id, log.userId, {"subscribed": False})
    await unsubscribe_repository.add(log.userId, contact.email, "recipient unsubscribed via email link")

    if log.id:
        collection = EmailLog.get_pymongo_collection()
        await collection.update_one({"_id": log.id}, {"$set": {"unsubscribed": True}})
        await email_event_repository.record(
            campaign_id=log.campaignId, contact_id=log.contactId, email_log_id=log.id, user_id=log.userId, event_type="UNSUBSCRIBED"
        )
