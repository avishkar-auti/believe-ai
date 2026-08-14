function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Escapes the characters ICS's TEXT value type requires escaped (RFC 5545 §3.3.11). */
function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export interface MeetingIcsInput {
  uid: string;
  scheduledAt: Date;
  durationMinutes: number;
  summary: string;
  description: string;
  joinUrl: string;
  organizerEmail: string;
  organizerName: string;
  attendeeEmail: string;
}

/** A minimal single-VEVENT calendar invite — enough for every major mail client to render a join button. */
export function buildMeetingIcs(input: MeetingIcsInput): string {
  const start = input.scheduledAt;
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const now = new Date();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//believe.ai//Live Practice Room//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${input.uid}@believe.ai`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(input.summary)}`,
    `DESCRIPTION:${escapeIcsText(input.description)}`,
    `LOCATION:${escapeIcsText(input.joinUrl)}`,
    `ORGANIZER;CN=${escapeIcsText(input.organizerName)}:mailto:${input.organizerEmail}`,
    `ATTENDEE;CN=${escapeIcsText(input.attendeeEmail)};RSVP=TRUE:mailto:${input.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // ICS requires CRLF line endings.
  return lines.join("\r\n");
}
