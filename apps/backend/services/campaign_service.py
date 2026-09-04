"""Campaigns — mirrors apps/api's campaign.service.ts's CRUD + state-machine
surface, including launch()/resume()'s send-job scheduling (spacing +
jitter, identical math to Node's) now that the arq send queue exists."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from core.errors import InvalidStateTransitionError, NotFoundError, ValidationError
from models.campaign import CAMPAIGN_STATUS_TRANSITIONS, Campaign, CampaignStatus
from models.email_log import EmailLog
from repositories import (
    campaign_repository,
    contact_repository,
    email_log_repository,
    resume_repository,
    template_repository,
    unsubscribe_repository,
)
from schemas.campaign import (
    CampaignAnalytics,
    CampaignDto,
    CampaignFollowUpDto,
    CreateCampaignInput,
    EmailLogDto,
    UpdateCampaignInput,
)
from schemas.pagination import PaginatedResult, total_pages
from services import usage_service
from utils.mongo_datetime import as_aware_utc
from worker.client import get_worker_pool

_TERMINAL_TO_SENT_STATUSES = ("SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED")
_DAY_MS = 86_400_000


def _to_dto(doc: Campaign) -> CampaignDto:
    return CampaignDto(
        id=str(doc.id),
        userId=str(doc.userId),
        name=doc.name,
        subject=doc.subject,
        templateId=str(doc.templateId),
        resumeId=str(doc.resumeId) if doc.resumeId else None,
        audienceContactIds=[str(cid) for cid in doc.audienceContactIds],
        status=doc.status,
        scheduledAt=doc.scheduledAt.isoformat() if doc.scheduledAt else None,
        timezone=doc.timezone,
        dailyLimit=doc.dailyLimit,
        personalizationEnabled=doc.personalizationEnabled,
        trackingEnabled=doc.trackingEnabled,
        followUps=[
            CampaignFollowUpDto(templateId=str(f.templateId), delayDays=f.delayDays, subjectOverride=f.subjectOverride)
            for f in doc.followUps
        ],
        stopOnReply=doc.stopOnReply,
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


def _email_log_to_dto(doc: EmailLog) -> EmailLogDto:
    return EmailLogDto(
        id=str(doc.id),
        campaignId=str(doc.campaignId),
        contactId=str(doc.contactId),
        userId=str(doc.userId),
        stepIndex=doc.stepIndex,
        status=doc.status,
        providerMessageId=doc.providerMessageId,
        trackingToken=doc.trackingToken,
        openCount=doc.openCount,
        clickCount=doc.clickCount,
        replied=doc.replied,
        errorMessage=doc.errorMessage,
        sentAt=doc.sentAt.isoformat() if doc.sentAt else None,
        openedAt=doc.openedAt.isoformat() if doc.openedAt else None,
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


def _assert_transition(from_status: CampaignStatus, to_status: CampaignStatus) -> None:
    if to_status not in CAMPAIGN_STATUS_TRANSITIONS[from_status]:
        raise InvalidStateTransitionError(f"Cannot move a campaign from {from_status} to {to_status}")


async def list_campaigns(user_id: ObjectId, status: CampaignStatus | None = None) -> list[CampaignDto]:
    docs = await campaign_repository.list_for_user(user_id, status)
    return [_to_dto(doc) for doc in docs]


async def get_by_id(campaign_id: ObjectId, user_id: ObjectId) -> CampaignDto:
    doc = await campaign_repository.find_by_id(campaign_id, user_id)
    if not doc:
        raise NotFoundError("Campaign not found")
    return _to_dto(doc)


async def create(user_id: ObjectId, input_: CreateCampaignInput) -> CampaignDto:
    await usage_service.assert_can_create_campaign(user_id)

    template_id = ObjectId(input_.templateId)
    template = await template_repository.find_by_id(template_id, user_id)
    if not template:
        raise ValidationError("Template not found")

    resume_id = ObjectId(input_.resumeId) if input_.resumeId else None
    if resume_id and not await resume_repository.find_by_id(user_id, resume_id):
        raise ValidationError("Resume not found")

    audience_ids = [ObjectId(cid) for cid in input_.audienceContactIds]
    contacts = await contact_repository.find_many_by_ids(audience_ids, user_id)
    if len(contacts) != len(audience_ids):
        raise ValidationError("Some contacts in the audience were not found")

    for follow_up in input_.followUps:
        follow_up_template = await template_repository.find_by_id(ObjectId(follow_up.templateId), user_id)
        if not follow_up_template:
            raise ValidationError("One or more follow-up templates were not found")

    doc = await campaign_repository.create(
        user_id,
        {
            "name": input_.name,
            "subject": input_.subject,
            "templateId": template_id,
            "resumeId": resume_id,
            "audienceContactIds": audience_ids,
            "scheduledAt": input_.scheduledAt,
            "timezone": input_.timezone,
            "dailyLimit": input_.dailyLimit,
            "personalizationEnabled": input_.personalizationEnabled,
            "trackingEnabled": input_.trackingEnabled,
            "followUps": [f.model_dump() for f in input_.followUps],
            "stopOnReply": input_.stopOnReply,
        },
    )
    return _to_dto(doc)


async def update(campaign_id: ObjectId, user_id: ObjectId, input_: UpdateCampaignInput) -> CampaignDto:
    existing = await campaign_repository.find_by_id(campaign_id, user_id)
    if not existing:
        raise NotFoundError("Campaign not found")
    if existing.status != "DRAFT":
        raise InvalidStateTransitionError("Only draft campaigns can be edited")

    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    if "templateId" in updates:
        updates["templateId"] = ObjectId(updates["templateId"])
    if "resumeId" in updates:
        updates["resumeId"] = ObjectId(updates["resumeId"]) if updates["resumeId"] else None
    if "audienceContactIds" in updates:
        updates["audienceContactIds"] = [ObjectId(cid) for cid in updates["audienceContactIds"]]
    if "followUps" in updates:
        updates["followUps"] = [
            {"templateId": f["templateId"], "delayDays": f["delayDays"], "subjectOverride": f.get("subjectOverride")}
            for f in updates["followUps"]
        ]

    doc = await campaign_repository.update(campaign_id, user_id, updates)
    if not doc:
        raise NotFoundError("Campaign not found")
    return _to_dto(doc)


async def launch(campaign_id: ObjectId, user_id: ObjectId) -> CampaignDto:
    """Creates one EmailLog per sendable recipient (skipping anyone unsubscribed
    or previously suppressed) and schedules a send job for each, spaced out
    across dailyLimit with jitter so sends never burst."""
    doc = await campaign_repository.find_by_id(campaign_id, user_id)
    if not doc:
        raise NotFoundError("Campaign not found")

    is_future_schedule = bool(doc.scheduledAt and as_aware_utc(doc.scheduledAt) > datetime.now(UTC))
    target_status: CampaignStatus = "SCHEDULED" if is_future_schedule else "RUNNING"
    _assert_transition(doc.status, target_status)

    contacts = await contact_repository.find_many_by_ids(doc.audienceContactIds, user_id)
    unsubscribed_emails = await unsubscribe_repository.find_unsubscribed_emails(user_id, [c.email for c in contacts])
    sendable = [c for c in contacts if c.subscribed and c.email not in unsubscribed_emails]

    if not sendable:
        raise ValidationError("No sendable recipients — all contacts are unsubscribed or excluded")

    # Launch-time guard against the plan's daily allowance. The queue still
    # paces the actual sends via dailyLimit; this stops a launch that would
    # blow through the plan cap before any of it goes out.
    await usage_service.assert_can_send_emails(user_id, len(sendable))

    logs = [EmailLog(campaignId=campaign_id, contactId=c.id, userId=user_id, trackingToken=secrets.token_hex(16)) for c in sendable if c.id]
    await email_log_repository.insert_many(logs)

    spacing_ms = max(1, _DAY_MS // max(doc.dailyLimit, 1))
    base_delay_ms = 0
    if is_future_schedule and doc.scheduledAt:
        base_delay_ms = max(0, int((as_aware_utc(doc.scheduledAt) - datetime.now(UTC)).total_seconds() * 1000))

    pool = await get_worker_pool()
    for index, log in enumerate(logs):
        jitter_ms = secrets.randbelow(5000)
        delay_ms = base_delay_ms + index * spacing_ms + jitter_ms
        await pool.enqueue_job("send_campaign_email", str(log.id), _job_id=str(log.id), _defer_by=delay_ms / 1000)

    updated = await campaign_repository.set_status(campaign_id, user_id, target_status)
    assert updated is not None
    return _to_dto(updated)


async def resume(campaign_id: ObjectId, user_id: ObjectId) -> CampaignDto:
    """Resuming re-enqueues every recipient still stuck at QUEUED. Jobs that
    were already delayed and fired while paused get skipped by the send job
    (it checks campaign status at send time) rather than sent — so they need
    a fresh job here or they'd never go out."""
    existing = await campaign_repository.find_by_id(campaign_id, user_id)
    if not existing:
        raise NotFoundError("Campaign not found")
    _assert_transition(existing.status, "RUNNING")

    updated = await campaign_repository.set_status(campaign_id, user_id, "RUNNING")
    assert updated is not None

    still_queued = await email_log_repository.find_queued_by_campaign(campaign_id)
    spacing_ms = max(1, _DAY_MS // max(existing.dailyLimit, 1))

    pool = await get_worker_pool()
    now_ms = int(datetime.now(UTC).timestamp() * 1000)
    for index, log in enumerate(still_queued):
        jitter_ms = secrets.randbelow(5000)
        delay_ms = index * spacing_ms + jitter_ms
        await pool.enqueue_job("send_campaign_email", str(log.id), _job_id=f"{log.id}-resume-{now_ms}", _defer_by=delay_ms / 1000)

    return _to_dto(updated)


async def pause(campaign_id: ObjectId, user_id: ObjectId) -> CampaignDto:
    existing = await campaign_repository.find_by_id(campaign_id, user_id)
    if not existing:
        raise NotFoundError("Campaign not found")
    _assert_transition(existing.status, "PAUSED")
    doc = await campaign_repository.set_status(campaign_id, user_id, "PAUSED")
    assert doc is not None
    return _to_dto(doc)


async def cancel(campaign_id: ObjectId, user_id: ObjectId) -> CampaignDto:
    existing = await campaign_repository.find_by_id(campaign_id, user_id)
    if not existing:
        raise NotFoundError("Campaign not found")
    _assert_transition(existing.status, "CANCELLED")
    doc = await campaign_repository.set_status(campaign_id, user_id, "CANCELLED")
    assert doc is not None
    return _to_dto(doc)


async def get_analytics(campaign_id: ObjectId, user_id: ObjectId) -> CampaignAnalytics:
    await get_by_id(campaign_id, user_id)
    rows = await email_log_repository.aggregate_by_campaign(campaign_id)
    counts: dict[str, int] = {row["_id"]: row["count"] for row in rows}

    sent = sum(counts.get(s, 0) for s in _TERMINAL_TO_SENT_STATUSES)
    delivered = sent
    opened = sum(counts.get(s, 0) for s in ("OPENED", "CLICKED", "REPLIED"))
    clicked = sum(counts.get(s, 0) for s in ("CLICKED", "REPLIED"))
    replied = counts.get("REPLIED", 0)
    bounced = counts.get("BOUNCED", 0)
    failed = counts.get("FAILED", 0)

    def rate(numerator: int, denominator: int) -> float:
        return round((numerator / denominator) * 1000) / 10 if denominator > 0 else 0.0

    return CampaignAnalytics(
        sent=sent,
        delivered=delivered,
        opened=opened,
        clicked=clicked,
        replied=replied,
        bounced=bounced,
        failed=failed,
        openRate=rate(opened, sent),
        clickRate=rate(clicked, sent),
        replyRate=rate(replied, sent),
        bounceRate=rate(bounced, sent),
    )


async def list_recipients(campaign_id: ObjectId, user_id: ObjectId, page: int, limit: int) -> PaginatedResult[EmailLogDto]:
    await get_by_id(campaign_id, user_id)
    items, total = await email_log_repository.list_for_campaign(campaign_id, page, limit)
    return PaginatedResult[EmailLogDto](
        items=[_email_log_to_dto(doc) for doc in items],
        page=page,
        limit=limit,
        total=total,
        totalPages=total_pages(total, limit),
    )


async def mark_replied(campaign_id: ObjectId, contact_id: ObjectId, user_id: ObjectId) -> None:
    await get_by_id(campaign_id, user_id)
    log = await email_log_repository.find_latest_for_contact(campaign_id, contact_id)
    if not log or not log.id:
        raise NotFoundError("No email has been sent to this contact for this campaign")
    await email_log_repository.mark_replied(log.id)
