"""Fires one scheduled follow-up (day 3, 7, or 14) — mirrors apps/worker's
sendOutreachFollowUp.ts. Re-checks `cancelled` immediately before sending —
a reply can arrive during the delay window, and mark_replied only flips
that flag, it doesn't reach into the queue to pull the job — so this is the
actual enforcement point, matching send_campaign_email.py's own
stop-on-reply check.

Retries on transient send failures via arq's Retry mechanism — 3 attempts,
exponential backoff starting at 10s, matching Node's BullMQ
`attempts: 3, backoff: { type: "exponential", delay: 10_000 }` exactly.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from arq import Retry

from core.config import get_settings
from core.logging import get_logger
from email_providers.base import SendEmailInput
from models.contact import Contact
from models.job_intel import JobIntel
from models.outreach_draft import OutreachDraft
from models.outreach_follow_up import OutreachFollowUp
from models.user import User
from repositories import outreach_follow_up_repository, outreach_send_log_repository, unsubscribe_repository
from services.email_provider_resolver import resolve_provider
from services.outreach_send_service import schedule_follow_up

logger = get_logger(__name__)

_MAX_TRIES = 3
_BASE_BACKOFF_SECONDS = 10

# Short, deterministic nudges rather than a second LLM call per follow-up — the goal
# is a polite escalating check-in, not new persuasive content, and every fact here
# (role, company) is already known, never invented.
_NUDGE_LINES = [
    "Just floating this back to the top of your inbox in case it got buried — still very interested in connecting.",
    "Following up once more on the note below — happy to share more detail if useful, no worries if now isn't the right time.",
    "Last check-in from me on this one. If the timing isn't right, no problem at all — wishing you well either way.",
]


def _build_follow_up_body(cold_email: str, sequence_number: int, role_title: str, company: str) -> str:
    nudge = _NUDGE_LINES[sequence_number - 1] if sequence_number - 1 < len(_NUDGE_LINES) else _NUDGE_LINES[-1]
    return f"{nudge}\n\n---\n\nRe: {role_title} at {company}\n\n{cold_email}"


async def _send(follow_up_id: str) -> None:
    settings = get_settings()
    follow_up = await OutreachFollowUp.get(follow_up_id)
    if not follow_up:
        logger.warning("Outreach follow-up %s no longer exists — skipping", follow_up_id)
        return
    if follow_up.sent or follow_up.cancelled:
        return

    draft = await OutreachDraft.get(follow_up.outreachDraftId)
    contact = await Contact.get(follow_up.contactId)
    if not draft or not contact:
        logger.warning("Draft or contact no longer exists for follow-up %s — skipping", follow_up_id)
        return

    job_intel = await JobIntel.get(draft.jobIntelId)
    if not job_intel:
        logger.warning("Job analysis no longer exists for follow-up %s — skipping", follow_up_id)
        return

    still_unsubscribed = not contact.subscribed or bool(
        await unsubscribe_repository.find_unsubscribed_emails(follow_up.userId, [contact.email])
    )
    if still_unsubscribed:
        await outreach_send_log_repository.create(
            follow_up.userId,
            follow_up.outreachDraftId,
            follow_up.contactId,
            "email",
            "suppressed",
            "follow_up",
            error_message="Recipient has unsubscribed.",
        )
        await outreach_follow_up_repository.mark_sent(follow_up.id)  # type: ignore[arg-type]
        return

    cold_email = (draft.editedText.coldEmail if draft.editedText else None) or draft.coldEmail
    body = _build_follow_up_body(cold_email, follow_up.sequenceNumber, job_intel.roleTitle, job_intel.company)
    subject = f"Re: Regarding the {job_intel.roleTitle} role at {job_intel.company}"

    sender = await User.get(follow_up.userId)
    if not sender:
        logger.warning("Sender account not found for follow-up %s — skipping", follow_up_id)
        return

    provider = await resolve_provider(settings, follow_up.userId)
    result = await provider.send_email(
        SendEmailInput(from_email=sender.email, to=contact.email, subject=subject, html=body.replace("\n", "<br/>"), text=body)
    )

    await outreach_send_log_repository.create(
        follow_up.userId,
        follow_up.outreachDraftId,
        follow_up.contactId,
        "email",
        "sent",
        "follow_up",
        sent_at=datetime.now(UTC),
        provider_message_id=result.provider_message_id,
    )
    await outreach_follow_up_repository.mark_sent(follow_up.id)  # type: ignore[arg-type]
    await schedule_follow_up(follow_up.userId, follow_up.outreachDraftId, follow_up.contactId, follow_up.sequenceNumber + 1)


async def send_outreach_follow_up(ctx: dict[str, Any], follow_up_id: str) -> None:
    job_try: int = ctx.get("job_try", 1)
    try:
        await _send(follow_up_id)
    except Exception as err:
        if job_try >= _MAX_TRIES:
            logger.warning("outreach.followup exhausted %d attempts for %s: %s", job_try, follow_up_id, err)
            follow_up = await OutreachFollowUp.get(follow_up_id)
            if follow_up:
                await outreach_send_log_repository.create(
                    follow_up.userId,
                    follow_up.outreachDraftId,
                    follow_up.contactId,
                    "email",
                    "failed",
                    "follow_up",
                    error_message=str(err),
                )
            return
        backoff_seconds = _BASE_BACKOFF_SECONDS * (2 ** (job_try - 1))
        logger.warning(
            "outreach.followup attempt %d/%d failed for %s, retrying in %ds: %s",
            job_try,
            _MAX_TRIES,
            follow_up_id,
            backoff_seconds,
            err,
        )
        raise Retry(defer=backoff_seconds) from err
