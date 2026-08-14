import { UserModel } from "@believe-ai/server";
import type { MeetingEmailJobData } from "@believe-ai/shared";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { resolveProvider } from "./emailProviderResolver.js";
import { buildMeetingIcs } from "../utils/buildMeetingIcs.js";

function formatWhen(scheduledAt: string): string {
  return new Date(scheduledAt).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export async function sendMeetingEmail(data: MeetingEmailJobData): Promise<void> {
  const host = await UserModel.findById(data.hostUserId);
  if (!host) {
    logger.warn({ roomId: data.roomId }, "Meeting email skipped — host no longer exists");
    return;
  }

  const joinUrl = `${env.APP_BASE_URL}/app/interview-room/${data.roomCode}`;
  const when = formatWhen(data.scheduledAt);
  const hostName = data.hostName || host.email;

  const isReminder = data.kind === "reminder";
  const subject = isReminder
    ? `Starting soon: Practice interview with ${hostName}`
    : `Invitation: Practice interview with ${hostName} — ${when}`;

  const html = isReminder
    ? `<p>Your practice interview with ${hostName} starts in about 10 minutes.</p><p><a href="${joinUrl}">Join the room</a></p>`
    : `<p>${hostName} scheduled a practice interview with you.</p><p><strong>When:</strong> ${when} (${data.durationMinutes} minutes)</p><p><a href="${joinUrl}">Join the room</a></p><p>The join link opens 10 minutes before the scheduled start.</p>`;

  const text = isReminder
    ? `Your practice interview with ${hostName} starts soon. Join: ${joinUrl}`
    : `${hostName} scheduled a practice interview with you.\nWhen: ${when} (${data.durationMinutes} minutes)\nJoin: ${joinUrl}`;

  const provider = await resolveProvider(data.hostUserId);

  const attachments = isReminder
    ? undefined
    : [
        {
          filename: "invite.ics",
          contentType: "text/calendar; method=REQUEST",
          content: Buffer.from(
            buildMeetingIcs({
              uid: data.roomId,
              scheduledAt: new Date(data.scheduledAt),
              durationMinutes: data.durationMinutes,
              summary: `believe.ai Practice Interview with ${hostName}`,
              description: `Join: ${joinUrl}`,
              joinUrl,
              organizerEmail: host.email,
              organizerName: hostName,
              attendeeEmail: data.guestEmail,
            }),
            "utf-8",
          ),
        },
      ];

  await provider.sendEmail({ from: host.email, to: data.guestEmail, subject, html, text, attachments });
}
