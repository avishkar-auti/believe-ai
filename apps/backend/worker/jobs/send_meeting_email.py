"""Sends a Live Practice Room invite or 10-minute-reminder email — mirrors
apps/worker's sendMeetingEmail.ts. Enqueued by
services/mock_interview_room_service.schedule() for each invited guest."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId

from core.config import get_settings
from core.logging import get_logger
from email_providers.base import EmailAttachment, SendEmailInput
from models.user import User
from services.email_provider_resolver import resolve_provider
from utils.build_meeting_ics import MeetingIcsInput, build_meeting_ics

logger = get_logger(__name__)


def _format_when(scheduled_at: datetime) -> str:
    # %-d/%-I (no leading zero) are glibc-only, not supported on Windows —
    # strip the zero-padding manually instead so this works on any platform.
    day = str(scheduled_at.day)
    hour_12 = scheduled_at.strftime("%I").lstrip("0") or "0"
    return scheduled_at.strftime(f"%A, %B {day}, %Y at {hour_12}:%M %p")


async def send_meeting_email(ctx: dict[str, Any], data: dict[str, Any]) -> None:
    settings = get_settings()
    host = await User.get(data["host_user_id"])
    if not host:
        logger.warning("Meeting email skipped for room %s — host no longer exists", data["room_id"])
        return

    scheduled_at = datetime.fromisoformat(data["scheduled_at"])
    join_url = f"{settings.app_base_url}/app/interview-room/{data['room_code']}"
    when = _format_when(scheduled_at)
    host_name = data["host_name"] or host.email

    is_reminder = data["kind"] == "reminder"
    if is_reminder:
        subject = f"Starting soon: Practice interview with {host_name}"
        html = f'<p>Your practice interview with {host_name} starts in about 10 minutes.</p><p><a href="{join_url}">Join the room</a></p>'
        text = f"Your practice interview with {host_name} starts soon. Join: {join_url}"
    else:
        subject = f"Invitation: Practice interview with {host_name} — {when}"
        html = (
            f"<p>{host_name} scheduled a practice interview with you.</p>"
            f"<p><strong>When:</strong> {when} ({data['duration_minutes']} minutes)</p>"
            f'<p><a href="{join_url}">Join the room</a></p>'
            f"<p>The join link opens 10 minutes before the scheduled start.</p>"
        )
        text = (
            f"{host_name} scheduled a practice interview with you.\n"
            f"When: {when} ({data['duration_minutes']} minutes)\nJoin: {join_url}"
        )

    provider = await resolve_provider(settings, ObjectId(data["host_user_id"]))

    attachments: list[EmailAttachment] = []
    if not is_reminder:
        ics = build_meeting_ics(
            MeetingIcsInput(
                uid=data["room_id"],
                scheduled_at=scheduled_at,
                duration_minutes=data["duration_minutes"],
                summary=f"believe.ai Practice Interview with {host_name}",
                description=f"Join: {join_url}",
                join_url=join_url,
                organizer_email=host.email,
                organizer_name=host_name,
                attendee_email=data["guest_email"],
            )
        )
        attachments.append(
            EmailAttachment(filename="invite.ics", content=ics.encode("utf-8"), content_type="text/calendar; method=REQUEST")
        )

    await provider.send_email(
        SendEmailInput(from_email=host.email, to=data["guest_email"], subject=subject, html=html, text=text, attachments=attachments)
    )
