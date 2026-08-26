"""Mirrors apps/worker's buildMeetingIcs.ts — a minimal single-VEVENT
calendar invite, enough for every major mail client to render a join
button."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta


def _to_ics_date(value: datetime) -> str:
    return value.astimezone(UTC).strftime("%Y%m%dT%H%M%SZ")


def _escape_ics_text(value: str) -> str:
    """Escapes the characters ICS's TEXT value type requires escaped (RFC 5545 §3.3.11)."""
    value = value.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,")
    return re.sub(r"\n", r"\\n", value)


@dataclass
class MeetingIcsInput:
    uid: str
    scheduled_at: datetime
    duration_minutes: int
    summary: str
    description: str
    join_url: str
    organizer_email: str
    organizer_name: str
    attendee_email: str


def build_meeting_ics(input_: MeetingIcsInput) -> str:
    start = input_.scheduled_at
    end = start + timedelta(minutes=input_.duration_minutes)
    now = datetime.now(UTC)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//believe.ai//Live Practice Room//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        f"UID:{input_.uid}@believe.ai",
        f"DTSTAMP:{_to_ics_date(now)}",
        f"DTSTART:{_to_ics_date(start)}",
        f"DTEND:{_to_ics_date(end)}",
        f"SUMMARY:{_escape_ics_text(input_.summary)}",
        f"DESCRIPTION:{_escape_ics_text(input_.description)}",
        f"LOCATION:{_escape_ics_text(input_.join_url)}",
        f"ORGANIZER;CN={_escape_ics_text(input_.organizer_name)}:mailto:{input_.organizer_email}",
        f"ATTENDEE;CN={_escape_ics_text(input_.attendee_email)};RSVP=TRUE:mailto:{input_.attendee_email}",
        "STATUS:CONFIRMED",
        "SEQUENCE:0",
        "END:VEVENT",
        "END:VCALENDAR",
    ]
    # ICS requires CRLF line endings.
    return "\r\n".join(lines)
