"""Campaigns — mirrors apps/api's campaign.service.ts's CRUD + state-machine
surface, including launch()/resume()'s send-job scheduling (spacing +
jitter, identical math to Node's) now that the arq send queue exists."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from agents.email_writer_agent import generate_email
from core.config import Settings
from core.errors import InvalidStateTransitionError, NotFoundError, ValidationError
from models.campaign import CAMPAIGN_STATUS_TRANSITIONS, Campaign, CampaignStatus
from models.campaign_link import LinkCategory
from models.email_log import EmailLog, EmailLogStatus
from models.portfolio_project import PortfolioProject
from repositories import (
    campaign_link_repository,
    campaign_repository,
    contact_repository,
    email_event_repository,
    email_log_repository,
    resume_repository,
    template_repository,
    unsubscribe_repository,
    user_repository,
)
from repositories.email_log_repository import RecipientSegment
from schemas.ai import AiEmailGenerationRequest, AiEmailGenerationResult
from schemas.campaign import (
    CampaignAnalytics,
    CampaignDto,
    CampaignFollowUpDto,
    CampaignLinkDto,
    CreateCampaignInput,
    EmailEventDto,
    EmailLogDto,
    EngagementTimeseriesPoint,
    InsightActionCardDto,
    ProjectEngagementDto,
    UpdateCampaignInput,
)
from schemas.pagination import PaginatedResult, total_pages
from services import personalization, usage_service
from utils.mongo_datetime import as_aware_utc
from worker.client import get_worker_pool

_DAY_MS = 86_400_000

_CATEGORY_LABELS: dict[LinkCategory, str] = {
    "RESUME": "resume",
    "PORTFOLIO": "portfolio",
    "GITHUB": "GitHub",
    "LINKEDIN": "LinkedIn",
    "PROJECT": "project link",
    "CODING_PROFILE": "coding profile",
    "CERTIFICATE": "certificate",
    "PERSONAL_WEBSITE": "personal website",
    "OTHER": "link",
}


def _rate(numerator: int, denominator: int) -> float:
    return round((numerator / denominator) * 1000) / 10 if denominator > 0 else 0.0


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


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


def _recipient_row_to_dto(row: dict) -> EmailLogDto:
    """Builds an EmailLogDto from the joined dict rows
    email_log_repository.list_for_campaign_filtered returns (contact fields
    included) — the shape the recipient table's filters/segments query."""
    return EmailLogDto(
        id=str(row["_id"]),
        campaignId=str(row["campaignId"]),
        contactId=str(row["contactId"]),
        userId=str(row["userId"]),
        stepIndex=row["stepIndex"],
        status=row["status"],
        providerMessageId=row.get("providerMessageId"),
        trackingToken=row["trackingToken"],
        openCount=row["openCount"],
        clickCount=row["clickCount"],
        opened=row.get("opened", False),
        lastOpenedAt=_iso(row.get("lastOpenedAt")),
        clicked=row.get("clicked", False),
        firstClickedAt=_iso(row.get("firstClickedAt")),
        lastClickedAt=_iso(row.get("lastClickedAt")),
        replied=row["replied"],
        replyCount=row.get("replyCount", 0),
        firstRepliedAt=_iso(row.get("firstRepliedAt")),
        lastRepliedAt=_iso(row.get("lastRepliedAt")),
        bounced=row.get("bounced", False),
        bouncedAt=_iso(row.get("bouncedAt")),
        bounceReason=row.get("bounceReason"),
        unsubscribed=row.get("unsubscribed", False),
        lastActivityAt=_iso(row.get("lastActivityAt")),
        errorMessage=row.get("errorMessage"),
        sentAt=_iso(row.get("sentAt")),
        openedAt=_iso(row.get("openedAt")),
        createdAt=row["createdAt"].isoformat(),
        updatedAt=row["updatedAt"].isoformat(),
        contactName=row.get("contactName"),
        contactEmail=row.get("contactEmail"),
        contactCompany=row.get("contactCompany"),
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


async def delete(campaign_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await campaign_repository.delete(campaign_id, user_id)
    if not deleted:
        raise NotFoundError("Campaign not found")


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


async def _assert_personalization_ready(doc: Campaign, user_id: ObjectId) -> None:
    """Blocks a launch whose templates use merge variables that would render
    blank for every single recipient.

    Only sender variables and unrecognized names are checked. Recipient
    variables are deliberately not: contacts legitimately have partial data,
    and one contact missing a job title shouldn't stop a send to two hundred
    others. A sender variable, by contrast, resolves from one profile — if
    it's empty here it's empty in every email, and the fix is a single edit
    on the Profile page.

    Checked at launch rather than on save so a half-written template can
    still be saved, and so a profile filled in afterwards needs no template
    change to take effect.
    """
    user = await user_repository.find_by_id(user_id)
    if not user:
        raise NotFoundError("User not found")
    sender_values = personalization.sender_values_for_user(user)

    template_ids = [doc.templateId, *(f.templateId for f in doc.followUps)]
    texts: list[str] = [doc.subject or "", *(f.subjectOverride or "" for f in doc.followUps)]
    for template_id in template_ids:
        if not template_id:
            continue
        template = await template_repository.find_by_id(template_id, user_id)
        if template:
            texts.extend([template.subject, template.body])

    issues = personalization.validate(*texts, values=sender_values)
    missing = [i.label for i in issues if i.reason == "missing" and i.group == "sender"]
    unknown = [i.variable for i in issues if i.reason == "unknown"]

    if missing:
        fields = ", ".join(dict.fromkeys(missing))
        raise ValidationError(
            f"Your templates use {fields}, which {'is' if len(missing) == 1 else 'are'} empty on your profile. "
            f"Fill {'it' if len(missing) == 1 else 'them'} in on the Profile page, or remove the variable from the template."
        )
    if unknown:
        names = ", ".join(f"{{{{{name}}}}}" for name in dict.fromkeys(unknown))
        raise ValidationError(f"Your templates use unknown variable(s): {names}. They would render as empty text for every recipient.")


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
    await _assert_personalization_ready(doc, user_id)

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
    counts = await email_log_repository.aggregate_engagement_by_campaign(campaign_id)

    sent = counts["sent"]
    # `delivered` stays aliased to `sent` on purpose — see the field's
    # docstring in schemas/campaign.py. No provider webhook in this codebase
    # can independently confirm inbox delivery.
    delivered = sent

    return CampaignAnalytics(
        sent=sent,
        delivered=delivered,
        uniqueOpened=counts["uniqueOpened"],
        totalOpens=counts["totalOpens"],
        uniqueClicked=counts["uniqueClicked"],
        totalClicks=counts["totalClicks"],
        replied=counts["replied"],
        bounced=counts["bounced"],
        failed=counts["failed"],
        unsubscribed=counts["unsubscribed"],
        openRate=_rate(counts["uniqueOpened"], delivered),
        clickRate=_rate(counts["uniqueClicked"], delivered),
        replyRate=_rate(counts["replied"], delivered),
        bounceRate=_rate(counts["bounced"], delivered),
    )


async def list_recipients(
    campaign_id: ObjectId,
    user_id: ObjectId,
    page: int,
    limit: int,
    *,
    status: EmailLogStatus | None = None,
    segment: RecipientSegment | None = None,
    search: str | None = None,
) -> PaginatedResult[EmailLogDto]:
    await get_by_id(campaign_id, user_id)
    rows, total = await email_log_repository.list_for_campaign_filtered(
        campaign_id, page, limit, status=status, segment=segment, search=search
    )
    return PaginatedResult[EmailLogDto](
        items=[_recipient_row_to_dto(row) for row in rows],
        page=page,
        limit=limit,
        total=total,
        totalPages=total_pages(total, limit),
    )


async def get_recipient_timeline(campaign_id: ObjectId, contact_id: ObjectId, user_id: ObjectId) -> list[EmailEventDto]:
    """Full engagement history for one recipient — the activity drawer's data."""
    await get_by_id(campaign_id, user_id)
    log = await email_log_repository.find_latest_for_contact(campaign_id, contact_id)
    if not log or not log.id:
        raise NotFoundError("No email has been sent to this contact for this campaign")

    events = await email_event_repository.list_for_email_log(log.id)
    links = {str(link.id): link.url for link in await campaign_link_repository.list_for_campaign(campaign_id)}
    return [
        EmailEventDto(
            id=str(event.id),
            type=event.type,
            linkId=str(event.linkId) if event.linkId else None,
            linkUrl=links.get(str(event.linkId)) if event.linkId else None,
            metadata=event.metadata,
            createdAt=event.createdAt.isoformat(),
        )
        for event in events
    ]


async def get_campaign_links(campaign_id: ObjectId, user_id: ObjectId) -> list[CampaignLinkDto]:
    """Top Clicked Links — every distinct professional link the campaign's
    template pointed to, ranked by real click counts."""
    await get_by_id(campaign_id, user_id)
    links = await campaign_link_repository.list_for_campaign(campaign_id)
    return [
        CampaignLinkDto(id=str(link.id), url=link.url, category=link.category, label=link.label, clickCount=link.clickCount)
        for link in links
    ]


async def get_engagement_timeseries(campaign_id: ObjectId, user_id: ObjectId) -> list[EngagementTimeseriesPoint]:
    await get_by_id(campaign_id, user_id)
    rows = await email_event_repository.engagement_over_time(campaign_id, ["SENT", "OPENED", "CLICKED", "REPLIED"])

    by_date: dict[str, dict[str, int]] = {}
    for row in rows:
        date = row["_id"]["date"]
        event_type = row["_id"]["type"]
        by_date.setdefault(date, {"SENT": 0, "OPENED": 0, "CLICKED": 0, "REPLIED": 0})[event_type] = row["count"]

    return [
        EngagementTimeseriesPoint(
            date=date, sent=counts["SENT"], opened=counts["OPENED"], clicked=counts["CLICKED"], replied=counts["REPLIED"]
        )
        for date, counts in sorted(by_date.items())
    ]


async def get_top_projects(campaign_id: ObjectId, user_id: ObjectId) -> list[ProjectEngagementDto]:
    """Most Viewed Projects — only ever a link that matches one of the
    user's own PortfolioProject entries (by URL); a campaign link with no
    match (e.g. a raw GitHub org URL, not a listed project) is simply not a
    "project" this list can name, so it's excluded rather than guessed at."""
    await get_by_id(campaign_id, user_id)
    links = await campaign_link_repository.list_for_campaign(campaign_id)
    projects = await PortfolioProject.find(PortfolioProject.userId == user_id).to_list()

    url_to_project: dict[str, PortfolioProject] = {}
    for project in projects:
        for url in (project.githubUrl, project.liveUrl):
            if url:
                url_to_project[url.rstrip("/")] = project

    matched = [
        ProjectEngagementDto(
            id=str(link.id),
            name=matched_project.name,
            description=matched_project.description,
            url=link.url,
            category=link.category,
            clickCount=link.clickCount,
        )
        for link in links
        if (matched_project := url_to_project.get(link.url.rstrip("/")))
    ]
    return sorted(matched, key=lambda p: p.clickCount, reverse=True)


async def get_insight_action_cards(campaign_id: ObjectId, user_id: ObjectId) -> list[InsightActionCardDto]:
    """Deterministic, arithmetic-only observations — no AI call, no invented
    percentages. Complements (doesn't replace) the free-text AI summary in
    get_campaign_insights, per the "generate deterministic analytics first"
    rule: these two facts don't need an LLM to be true."""
    await get_by_id(campaign_id, user_id)
    cards: list[InsightActionCardDto] = []

    links = [link for link in await campaign_link_repository.list_for_campaign(campaign_id) if link.clickCount > 0]
    if links:
        top = links[0]
        rest = links[1:]
        rest_avg = sum(link.clickCount for link in rest) / len(rest) if rest else 0
        label = _CATEGORY_LABELS[top.category]
        if rest_avg > 0 and top.clickCount > rest_avg:
            multiplier = round(top.clickCount / rest_avg, 1)
            body = f"Recruiters click your {label} about {multiplier}x more than your other links."
        else:
            body = f"Your {label} is the only link recruiters have clicked so far."
        cards.append(InsightActionCardDto(icon="trending", title=f"Your {label} is getting noticed", body=body))

    _, engaged_no_reply_count = await email_log_repository.list_for_campaign_filtered(campaign_id, 1, 1, segment="clicked_no_reply")
    if engaged_no_reply_count > 0:
        plural = "s" if engaged_no_reply_count != 1 else ""
        cards.append(
            InsightActionCardDto(
                icon="users",
                title=f"{engaged_no_reply_count} recipient{plural} engaged but haven't replied",
                body=(
                    "They opened or clicked something in your email — a personalized "
                    "follow-up referencing what they looked at is worth trying."
                ),
            )
        )
    return cards


async def generate_follow_up_draft(settings: Settings, campaign_id: ObjectId, user_id: ObjectId) -> AiEmailGenerationResult:
    """Drafts a follow-up email grounded in this campaign's real engagement
    data — reuses the existing generic email-writer agent (goal/target/tone)
    rather than adding a new AI-provider capability for what is, underneath,
    the same "write an email for this situation" task."""
    campaign = await get_by_id(campaign_id, user_id)
    _, engaged_no_reply_count = await email_log_repository.list_for_campaign_filtered(campaign_id, 1, 1, segment="clicked_no_reply")
    if engaged_no_reply_count == 0:
        raise ValidationError("No engaged-but-unreplied recipients yet — nothing to follow up on.")

    links = [link for link in await campaign_link_repository.list_for_campaign(campaign_id) if link.clickCount > 0]
    context_parts = [
        f'This is a follow-up for the "{campaign.name}" job-outreach campaign.',
        f"{engaged_no_reply_count} recipient(s) opened or clicked a link in the original email but haven't replied yet.",
    ]
    if links:
        context_parts.append(f"Their most-clicked link was the sender's {_CATEGORY_LABELS[links[0].category]} ({links[0].url}).")

    req = AiEmailGenerationRequest(
        goal=(
            "Write a short, warm follow-up email to a recruiter/contact who engaged with a prior "
            "outreach email (opened or clicked a link) but hasn't replied yet."
        ),
        target="A recruiter or hiring contact who showed interest but went quiet",
        tone="warm, concise, low-pressure — not pushy",
        context=" ".join(context_parts),
    )
    return await generate_email(settings, req)


async def mark_replied(campaign_id: ObjectId, contact_id: ObjectId, user_id: ObjectId) -> None:
    await get_by_id(campaign_id, user_id)
    log = await email_log_repository.find_latest_for_contact(campaign_id, contact_id)
    if not log or not log.id:
        raise NotFoundError("No email has been sent to this contact for this campaign")
    await email_log_repository.mark_replied(log.id)
    await email_event_repository.record(
        campaign_id=log.campaignId, contact_id=log.contactId, email_log_id=log.id, user_id=log.userId, event_type="REPLIED"
    )
