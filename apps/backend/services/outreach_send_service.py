"""Outreach sending — mirrors apps/api's outreachSend.service.ts. The
enforcement point for human_approval_gate: only reachable for a draft
already marked approved/edited. Two channels, handled completely
differently on purpose:
- LinkedIn: always logged "drafted", NEVER sent automatically — the note
  text is already shown in the UI for the user to copy and send themselves.
- Email: sent through the user's own connected Gmail/Outlook. A successful
  send schedules the day-3 follow-up.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from bson import ObjectId

from core.config import Settings
from core.errors import NotFoundError, ValidationError
from email_providers.base import SendEmailInput
from models.outreach_follow_up import OutreachFollowUp
from models.outreach_send_log import OutreachSendLog
from models.user import User
from repositories import (
    contact_repository,
    job_intel_repository,
    outreach_draft_repository,
    outreach_follow_up_repository,
    outreach_send_log_repository,
    unsubscribe_repository,
)
from schemas.outreach_send import OutreachFollowUpDto, OutreachSendLogDto, SendResult
from services.email_provider_resolver import resolve_provider
from worker.client import get_worker_pool

# Day 3/7/14 follow-up cadence, capped at 3.
FOLLOW_UP_DAYS = [3, 7, 14]
MAX_FOLLOW_UPS = 3


def _log_to_dto(doc: OutreachSendLog) -> OutreachSendLogDto:
    return OutreachSendLogDto(
        id=str(doc.id),
        userId=str(doc.userId),
        outreachDraftId=str(doc.outreachDraftId),
        contactId=str(doc.contactId),
        channel=doc.channel,
        status=doc.status,
        contentType=doc.contentType,
        sentAt=doc.sentAt.isoformat() if doc.sentAt else None,
        errorMessage=doc.errorMessage,
        createdAt=doc.createdAt.isoformat(),
    )


def _follow_up_to_dto(doc: OutreachFollowUp) -> OutreachFollowUpDto:
    return OutreachFollowUpDto(
        id=str(doc.id),
        userId=str(doc.userId),
        outreachDraftId=str(doc.outreachDraftId),
        contactId=str(doc.contactId),
        sequenceNumber=doc.sequenceNumber,
        scheduledFor=doc.scheduledFor.isoformat(),
        sent=doc.sent,
        cancelled=doc.cancelled,
        cancelReason=doc.cancelReason,
        createdAt=doc.createdAt.isoformat(),
    )


async def schedule_follow_up(user_id: ObjectId, outreach_draft_id: ObjectId, contact_id: ObjectId, sequence_number: int) -> None:
    if sequence_number > MAX_FOLLOW_UPS:
        return
    day_offset = FOLLOW_UP_DAYS[sequence_number - 1]

    scheduled_for = datetime.now(UTC) + timedelta(days=day_offset)
    follow_up = await outreach_follow_up_repository.create(user_id, outreach_draft_id, contact_id, sequence_number, scheduled_for)

    pool = await get_worker_pool()
    await pool.enqueue_job("send_outreach_follow_up", str(follow_up.id), _job_id=str(follow_up.id), _defer_by=day_offset * 86_400)


async def send(settings: Settings, user_id: ObjectId, draft_id: ObjectId) -> SendResult:
    draft = await outreach_draft_repository.find_by_id(draft_id, user_id)
    if not draft:
        raise NotFoundError("Draft not found")
    if draft.status not in ("approved", "edited"):
        raise ValidationError("Only approved or edited drafts can be sent")

    existing_logs = await outreach_send_log_repository.list_by_draft(draft_id, user_id)
    # Never re-send: once an email attempt actually reached "sent" or was correctly
    # "suppressed", clicking Send again must not risk a duplicate email to the same
    # contact. A prior "failed" attempt (e.g. no email provider connected yet) is the
    # one case worth retrying.
    if any(log.channel == "email" and log.status in ("sent", "suppressed") for log in existing_logs):
        raise ValidationError("This draft has already been sent")

    contact = await contact_repository.find_by_id(draft.contactId, user_id)
    job_intel = await job_intel_repository.find_by_id(draft.jobIntelId, user_id)
    if not contact or not job_intel:
        raise NotFoundError("Contact or job analysis no longer exists")

    assert draft.id is not None
    # The LinkedIn "drafted" record is permanent and only ever logged once — a
    # retry of the email side shouldn't duplicate it.
    linkedin_log = next((log for log in existing_logs if log.channel == "linkedin"), None)
    if not linkedin_log:
        linkedin_log = await outreach_send_log_repository.create(user_id, draft.id, draft.contactId, "linkedin", "drafted", "linkedin_note")

    # LinkedIn-only contacts (added without a real email — see
    # lead_discovery_service.add_to_contacts) have nothing to email: their
    # address is a generated placeholder, never a real inbox. The LinkedIn
    # note above is the entire point of sending for these, so stop here.
    if contact.outreachChannel == "linkedin":
        return SendResult(sendLogs=[_log_to_dto(linkedin_log)])

    still_unsubscribed = not contact.subscribed or bool(await unsubscribe_repository.find_unsubscribed_emails(user_id, [contact.email]))
    if still_unsubscribed:
        suppressed_log = await outreach_send_log_repository.create(
            user_id,
            draft.id,
            draft.contactId,
            "email",
            "suppressed",
            "cold_email",
            error_message="Recipient has unsubscribed.",
        )
        return SendResult(sendLogs=[_log_to_dto(linkedin_log), _log_to_dto(suppressed_log)])

    cold_email = (draft.editedText.coldEmail if draft.editedText else None) or draft.coldEmail
    subject = f"Regarding the {job_intel.roleTitle} role at {job_intel.company}"

    sender = await User.get(user_id)
    if not sender:
        email_log = await outreach_send_log_repository.create(
            user_id, draft.id, draft.contactId, "email", "failed", "cold_email", error_message="Sender account not found"
        )
        return SendResult(sendLogs=[_log_to_dto(linkedin_log), _log_to_dto(email_log)])

    try:
        provider = await resolve_provider(settings, user_id)
        result = await provider.send_email(
            SendEmailInput(
                from_email=sender.email,
                to=contact.email,
                subject=subject,
                html=cold_email.replace("\n", "<br/>"),
                text=cold_email,
            )
        )
        email_log = await outreach_send_log_repository.create(
            user_id,
            draft.id,
            draft.contactId,
            "email",
            "sent",
            "cold_email",
            sent_at=datetime.now(UTC),
            provider_message_id=result.provider_message_id,
        )
        await schedule_follow_up(user_id, draft.id, draft.contactId, 1)
    except Exception as err:  # noqa: BLE001 — a send failure is logged as a terminal status, not raised
        email_log = await outreach_send_log_repository.create(
            user_id, draft.id, draft.contactId, "email", "failed", "cold_email", error_message=str(err)
        )

    return SendResult(sendLogs=[_log_to_dto(linkedin_log), _log_to_dto(email_log)])


async def list_send_logs(draft_id: ObjectId, user_id: ObjectId) -> list[OutreachSendLogDto]:
    docs = await outreach_send_log_repository.list_by_draft(draft_id, user_id)
    return [_log_to_dto(doc) for doc in docs]


async def list_follow_ups(draft_id: ObjectId, user_id: ObjectId) -> list[OutreachFollowUpDto]:
    docs = await outreach_follow_up_repository.list_by_draft(draft_id, user_id)
    return [_follow_up_to_dto(doc) for doc in docs]


async def mark_replied(draft_id: ObjectId, user_id: ObjectId) -> None:
    """Cancels every remaining follow-up for this draft's contact — the manual
    reply-detection path (this codebase has no inbound-mail integration)."""
    draft = await outreach_draft_repository.find_by_id(draft_id, user_id)
    if not draft:
        raise NotFoundError("Draft not found")
    await outreach_follow_up_repository.cancel_pending(draft_id, user_id, "Contact replied")
