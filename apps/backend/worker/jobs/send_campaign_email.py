"""Processes a single queued recipient for one step of a campaign (the
initial send, or a follow-up) — mirrors apps/worker's sendCampaignEmail.ts.
Re-checks suppression, campaign state, and — for follow-ups — whether the
recipient already replied, all at send time since state can change between
enqueue and delivery.

Retries on transient send failures via arq's own Retry mechanism (raised
here explicitly, since arq's default is immediate retry with no backoff) —
5 attempts, exponential backoff starting at 5s, matching Node's BullMQ
`attempts: 5, backoff: { type: "exponential", delay: 5_000 }` exactly.
"""

from __future__ import annotations

import re
import secrets
from datetime import UTC, datetime
from typing import Any

from arq import Retry
from beanie import PydanticObjectId

from agents.personalization_agent import personalize_email
from core.config import get_settings
from core.link_signing import extract_anchor_links, rewrite_links_for_tracking
from core.logging import get_logger
from email_providers.base import EmailAttachment, SendEmailInput
from models.campaign import Campaign
from models.contact import Contact
from models.email_log import EmailLog
from models.template import Template, TemplateBodyFormat
from models.user import User
from repositories import (
    campaign_link_repository,
    email_event_repository,
    email_log_repository,
    resume_repository,
    unsubscribe_repository,
    user_context_repository,
)
from schemas.ai import AiPersonalizeRequest, ContactPersonalizationInput
from services import notification_service, personalization
from services.email_content import interpolate_html, normalize_legacy_text_to_html, to_html, to_markdown_text, to_plain_text
from services.email_provider_resolver import resolve_provider
from services.template_service import interpolate
from utils.user_context import format_user_context_for_prompt
from worker.client import get_worker_pool

logger = get_logger(__name__)

_MAX_TRIES = 5
_BASE_BACKOFF_SECONDS = 5

# Tokens whose real value the AI provider is never given — it can't fill
# these in on its own, and asking it to "preserve this exact {{}} syntax" in
# free-form rewriting isn't reliable. Split off before the AI call instead;
# see _split_signature(). Derived from the registry (and its snake_case
# aliases) rather than a hand-kept list, so a variable added there can't be
# quietly handed to the model.
_SENDER_TOKEN_ALIASES = {a for a, canonical in personalization.ALIASES.items() if canonical in personalization.SENDER_KEYS}
_SENDER_TOKEN_NAMES = sorted(personalization.SENDER_KEYS | _SENDER_TOKEN_ALIASES)
_SENDER_TOKEN_RE = re.compile(r"{{\s*(?:" + "|".join(_SENDER_TOKEN_NAMES) + r")\s*}}")


def _split_signature(body: str) -> tuple[str, str]:
    """Splits a template body into (content, signature) at the first
    sender token — everything from there on (typically a "Best regards,
    {{senderName}} / {{linkedin}} | {{github}}" sign-off) is treated as the
    signature. Only `content` is sent to the AI for personalization;
    `signature` is resolved by plain interpolate() and appended to the AI's
    output afterward. That's what makes every sender variable resolve to the
    real profile value whether or not AI personalization is on — the model
    never sees or has to preserve those tokens verbatim.

    A body using a sender variable mid-sentence ("I'm a {{senderTitle}}
    at...") therefore has its tail excluded from personalization. That's the
    deliberate trade: an un-personalized tail still says the right thing,
    whereas a token the model reworded or dropped loses the value outright —
    exactly the silent-loss failure this pipeline exists to prevent.

    Returns ("", body's sender tokens) only in the degenerate case where the
    whole template is a signature — the AI still gets called with an empty
    body rather than special-cased, since that's the template author's own
    (unusual) choice, not something to silently work around."""
    match = _SENDER_TOKEN_RE.search(body)
    if not match:
        return body, ""
    return body[: match.start()], body[match.start() :]


async def _maybe_complete_campaign(campaign_id: PydanticObjectId) -> None:
    """Transitions a RUNNING campaign to COMPLETED once no recipients remain
    queued. Called on every terminal outcome — sent, failed, or skipped — so
    a campaign whose last recipient bounced still completes rather than
    sitting in RUNNING forever.

    The status="RUNNING" filter makes this a conditional update: two workers
    finishing their last jobs concurrently can't both transition it, and it
    can never resurrect a campaign the user just paused or cancelled.
    """
    remaining = await EmailLog.find(EmailLog.campaignId == campaign_id, EmailLog.status == "QUEUED").count()
    if remaining > 0:
        return

    collection = Campaign.get_pymongo_collection()
    result = await collection.update_one({"_id": campaign_id, "status": "RUNNING"}, {"$set": {"status": "COMPLETED"}})
    if result.modified_count == 0:
        return

    logger.info("campaign %s completed — no recipients remaining", campaign_id)

    # modified_count > 0 means this worker won the transition, so exactly one
    # notification is created even if several finish concurrently.
    campaign = await Campaign.get(campaign_id)
    if not campaign:
        return
    try:
        await notification_service.create(
            campaign.userId,
            "campaign.completed",
            "Campaign completed",
            f'"{campaign.name}" has finished sending.',
            link=f"/app/campaigns/{campaign_id}",
        )
    except Exception as err:  # noqa: BLE001 — a notification failure must never break send flow
        logger.error("Failed to create campaign completion notification: %s", err)


async def _fail_log(email_log_id: PydanticObjectId, campaign_id: PydanticObjectId, error_message: str) -> None:
    await email_log_repository.set_status(email_log_id, "FAILED", error_message=error_message)
    log = await EmailLog.get(email_log_id)
    if log and log.id:
        await email_event_repository.record(
            campaign_id=log.campaignId, contact_id=log.contactId, email_log_id=log.id, user_id=log.userId,
            event_type="FAILED", metadata={"error": error_message},
        )
    await _maybe_complete_campaign(campaign_id)


async def _schedule_next_step(email_log: EmailLog, campaign: Campaign) -> None:
    """Schedules the next follow-up step, if the campaign has one configured
    beyond the step that was just sent. Reply-detection is manual (no inbound
    mail integration) — the actual stop-on-reply check happens when this next
    step is about to send, not here, so a reply arriving during the delay
    window still prevents the send."""
    step_index = email_log.stepIndex
    if step_index >= len(campaign.followUps):
        return
    next_follow_up = campaign.followUps[step_index]
    next_step_index = step_index + 1

    next_log = EmailLog(
        campaignId=email_log.campaignId,
        contactId=email_log.contactId,
        userId=email_log.userId,
        stepIndex=next_step_index,
        trackingToken=secrets.token_hex(16),
        status="QUEUED",
    )
    await next_log.insert()

    delay_ms = next_follow_up.delayDays * 86_400_000 + secrets.randbelow(5000)
    pool = await get_worker_pool()
    await pool.enqueue_job("send_campaign_email", str(next_log.id), _job_id=str(next_log.id), _defer_by=delay_ms / 1000)


_RAW_INTERPOLATE_KEYS = personalization.LINK_KEYS


async def _build_personalized_content(
    *,
    personalization_enabled: bool,
    user_id: PydanticObjectId,
    subject_source: str,
    template_body: str,
    body_format: TemplateBodyFormat,
    contact: Contact,
    values: dict[str, str],
) -> tuple[str, str]:
    """Personalizes via the AI provider when the campaign has it enabled,
    falling back to plain {{variable}} interpolation if personalization is
    off or the AI call fails — a provider hiccup should never block a send.

    Returns (subject, body_html) — body is always final, rendered, merge-
    variable-resolved HTML, regardless of which path produced it or what
    format the template was stored in. Real HTML is never handed to the AI
    provider for rewriting: personalization always operates on a text view of
    the body (to_markdown_text() first, for an HTML-format template, so links
    survive as [label](url)), and the result is re-rendered to HTML afterward
    via the same
    normalize_legacy_text_to_html() used for every other plain-text body —
    the one path that can't corrupt markup, since the model never sees any."""
    # `values` comes from services/personalization.py, which omits fields the
    # profile or contact genuinely doesn't have — interpolate() renders those
    # as "" rather than leaking a literal "None" into the email.
    subject = interpolate(subject_source, values)

    def render_fallback() -> str:
        rendered_html = to_html(template_body, body_format)
        return interpolate_html(rendered_html, values, raw_keys=_RAW_INTERPOLATE_KEYS)

    if not personalization_enabled:
        return subject, render_fallback()

    # to_markdown_text, not to_plain_text: the AI is handed a text view of the
    # body and its output is re-rendered to HTML afterwards, so any link has to
    # survive that trip. "label (url)" cannot be turned back into an anchor —
    # it used to arrive in the inbox as bare URL text with a broken href.
    # [label](url) round-trips, and models preserve it reliably.
    plain_body = template_body if body_format == "text" else to_markdown_text(template_body)
    content, signature = _split_signature(plain_body)

    try:
        profile = await user_context_repository.find_by_user_id(user_id)
        sender_context = (
            format_user_context_for_prompt(
                {
                    "aboutMe": profile.aboutMe,
                    "companyInfo": profile.companyInfo,
                    "servicesOrProducts": profile.servicesOrProducts,
                    "skillsAndExperience": profile.skillsAndExperience,
                    "achievements": profile.achievements,
                    "targetAudience": profile.targetAudience,
                }
            )
            if profile
            else None
        )

        result = await personalize_email(
            get_settings(),
            AiPersonalizeRequest(
                templateSubject=subject_source,
                templateBody=content,
                contact=ContactPersonalizationInput(
                    firstName=contact.firstName,
                    lastName=contact.lastName,
                    company=contact.company,
                    jobTitle=contact.jobTitle,
                ),
                senderContext=sender_context,
            ),
        )
        # Signature is appended (still holding raw {{tokens}}, not yet
        # interpolated) before normalizing to HTML, and interpolated only
        # after — interpolating first would inject the {{linkedin}}/
        # {{github}} anchor tags as raw text into what normalize treats as
        # plain input, HTML-escaping them into visible markup instead of a
        # real link.
        combined_plain = f"{result.body}\n\n{signature}" if signature else result.body
        rendered_html = normalize_legacy_text_to_html(combined_plain)
        return interpolate(result.subject, values), interpolate_html(rendered_html, values, raw_keys=_RAW_INTERPOLATE_KEYS)
    except Exception as err:  # noqa: BLE001 — AI assists, never blocks the core send workflow
        logger.warning("AI personalization failed for user %s, falling back to template interpolation: %s", user_id, err)
        return subject, render_fallback()


async def _send(email_log_id: str) -> None:
    settings = get_settings()
    log = await EmailLog.get(email_log_id)
    if not log:
        logger.warning("Email log %s no longer exists — skipping", email_log_id)
        return
    assert log.id is not None  # fetched by id, so it's always persisted and has one
    if log.status != "QUEUED":
        return  # already handled by a previous attempt

    campaign = await Campaign.get(log.campaignId)
    if not campaign or campaign.status != "RUNNING":
        logger.info("Skipping send for campaign %s — not running (status=%s)", log.campaignId, campaign and campaign.status)
        return

    if campaign.stopOnReply and log.stepIndex > 0:
        prior_reply = await EmailLog.find_one(
            EmailLog.campaignId == log.campaignId,
            EmailLog.contactId == log.contactId,
            EmailLog.replied == True,  # noqa: E712
        )
        if prior_reply:
            await _fail_log(log.id, log.campaignId, "Follow-up skipped — recipient already replied")
            return

    if log.stepIndex == 0:
        step_template_id: PydanticObjectId | None = campaign.templateId
        subject_override: str | None = None
    else:
        follow_up = campaign.followUps[log.stepIndex - 1] if log.stepIndex - 1 < len(campaign.followUps) else None
        step_template_id = follow_up.templateId if follow_up else None
        subject_override = follow_up.subjectOverride if follow_up else None

    contact = await Contact.get(log.contactId)
    template = await Template.get(step_template_id) if step_template_id else None
    sender = await User.get(log.userId)

    if not contact or not template or not sender:
        await _fail_log(log.id, log.campaignId, "Missing contact, template, or sender at send time")
        return

    still_unsubscribed = not contact.subscribed or bool(await unsubscribe_repository.find_unsubscribed_emails(log.userId, [contact.email]))
    if still_unsubscribed:
        await _fail_log(log.id, log.campaignId, "Recipient is unsubscribed")
        return

    # Both halves come from services/personalization.py — the same resolver
    # behind template preview, so what the composer showed is what this email
    # renders. Sender values are derived once per job from the profile
    # document already fetched above; one job is one recipient, so that's the
    # narrowest granularity available here, and only the recipient half varies.
    context = personalization.PersonalizationContext(
        sender=personalization.sender_values_for_user(sender),
        recipient=personalization.build_recipient_values(
            first_name=contact.firstName,
            last_name=contact.lastName,
            email=contact.email,
            company=contact.company,
            job_title=contact.jobTitle,
        ),
    )
    values = context.values()

    subject_source = (campaign.subject or template.subject) if log.stepIndex == 0 else (subject_override or template.subject)
    subject, body_html = await _build_personalized_content(
        personalization_enabled=campaign.personalizationEnabled,
        user_id=log.userId,
        subject_source=subject_source,
        template_body=template.body,
        body_format=template.bodyFormat,
        contact=contact,
        values=values,
    )

    api_base_url = settings.app_base_url  # this service's own public base URL doubles as the tracking-link host
    tracking_pixel = (
        f'<img src="{api_base_url}/t/open/{log.trackingToken}" width="1" height="1" alt="" style="display:none" />'
        if campaign.trackingEnabled
        else ""
    )
    unsubscribe_url = f"{api_base_url}/t/unsubscribe/{log.trackingToken}"

    # Route the body's links through the click-tracking endpoint. The unsubscribe
    # link is deliberately excluded — opting out must never look like engagement,
    # and it has to keep working even if tracking is off.
    assert settings.encryption_key is not None
    link_ids: dict[str, str] = {}
    if campaign.trackingEnabled:
        for destination, anchor_text in extract_anchor_links(body_html):
            if destination == unsubscribe_url:
                continue
            campaign_link = await campaign_link_repository.get_or_create(log.campaignId, log.userId, destination, anchor_text)
            if campaign_link.id:
                link_ids[destination] = str(campaign_link.id)
    tracked_body_html = (
        rewrite_links_for_tracking(
            body_html, log.trackingToken, api_base_url, settings.encryption_key, skip_urls=[unsubscribe_url], link_ids=link_ids
        )
        if campaign.trackingEnabled
        else body_html
    )

    # Real HTML -> text conversion (paragraph/list-aware, see
    # services/email_content.py) rather than a naive tag-strip — the
    # plain-text alternative keeps the original links since a text-only
    # client can't be click-tracked anyway and a bare redirect URL reads as
    # suspicious.
    text = f"{to_plain_text(body_html)}\n\nUnsubscribe: {unsubscribe_url}"

    html = (
        f'{tracked_body_html}{tracking_pixel}<p style="font-size:12px;color:#888;margin-top:24px">'
        f'<a href="{unsubscribe_url}">Unsubscribe</a></p>'
    )

    provider = await resolve_provider(settings, log.userId)

    attachments: list[EmailAttachment] = []
    if campaign.resumeId:
        resume = await resume_repository.find_by_id(log.userId, campaign.resumeId)
        resume_file = await resume_repository.find_file_by_resume_id(campaign.resumeId) if resume else None
        if resume and resume_file:
            attachments.append(
                EmailAttachment(
                    filename=f"{resume.targetRole or resume.fileName}.pdf",
                    content=resume_file.data,
                    content_type="application/pdf",
                )
            )
        else:
            logger.warning("Campaign %s references resume %s which no longer exists — sending without it", campaign.id, campaign.resumeId)

    # Let send failures propagate so the caller retries with backoff; only
    # once retries are exhausted does the log get marked FAILED.
    result = await provider.send_email(
        SendEmailInput(from_email=sender.email, to=contact.email, subject=subject, html=html, text=text, attachments=attachments)
    )

    log.status = "SENT"
    log.providerMessageId = result.provider_message_id
    log.sentAt = datetime.now(UTC)
    log.lastActivityAt = log.sentAt
    await log.save()
    if result.thread_id:
        await email_log_repository.set_thread_info(log.id, thread_id=result.thread_id)
    await email_event_repository.record(
        campaign_id=log.campaignId, contact_id=log.contactId, email_log_id=log.id, user_id=log.userId, event_type="SENT"
    )

    # Must run before the completion check — it may queue a follow-up, and a
    # campaign with a pending follow-up isn't finished.
    await _schedule_next_step(log, campaign)
    await _maybe_complete_campaign(log.campaignId)


async def send_campaign_email(ctx: dict[str, Any], email_log_id: str) -> None:
    job_try: int = ctx.get("job_try", 1)
    try:
        await _send(email_log_id)
    except Exception as err:
        if job_try >= _MAX_TRIES:
            logger.warning("email.send exhausted %d attempts for log %s: %s", job_try, email_log_id, err)
            log = await EmailLog.get(email_log_id)
            if log and log.id:
                await _fail_log(log.id, log.campaignId, str(err))
            return
        backoff_seconds = _BASE_BACKOFF_SECONDS * (2 ** (job_try - 1))
        logger.warning(
            "email.send attempt %d/%d failed for log %s, retrying in %ds: %s",
            job_try,
            _MAX_TRIES,
            email_log_id,
            backoff_seconds,
            err,
        )
        raise Retry(defer=backoff_seconds) from err
