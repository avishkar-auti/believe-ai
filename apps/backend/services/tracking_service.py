"""Open/click tracking and email-link unsubscribe — mirrors apps/api's
tracking.service.ts. Best-effort: many email clients block or proxy pixels,
so these calls never fail loudly, they just record what they can."""

from __future__ import annotations

from core.errors import NotFoundError
from repositories import contact_repository, email_log_repository, unsubscribe_repository


async def record_open(token: str) -> None:
    await email_log_repository.increment_open(token)


async def record_click(token: str) -> None:
    await email_log_repository.increment_click(token)


async def unsubscribe_by_token(token: str) -> None:
    log = await email_log_repository.find_by_tracking_token(token)
    if not log:
        raise NotFoundError("Invalid or expired unsubscribe link")

    contact = await contact_repository.find_by_id(log.contactId, log.userId)
    if not contact or not contact.id:
        return

    await contact_repository.update(contact.id, log.userId, {"subscribed": False})
    await unsubscribe_repository.add(log.userId, contact.email, "recipient unsubscribed via email link")
