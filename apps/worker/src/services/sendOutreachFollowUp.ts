import {
  ContactModel,
  JobIntelModel,
  OutreachDraftModel,
  OutreachFollowUpModel,
  OutreachSendLogModel,
  UnsubscribeRecordModel,
  UserModel,
} from "@believe-ai/server";
import { FOLLOW_UP_DAYS, MAX_FOLLOW_UPS, type OutreachFollowUpJobData } from "@believe-ai/shared";
import { resolveProvider } from "./emailProviderResolver.js";
import { outreachFollowUpQueue } from "../queues/outreachFollowUpQueue.js";

class SkipSend extends Error {}

// Short, deterministic nudges rather than a second LLM call per follow-up —
// the goal is a polite escalating check-in, not new persuasive content, and
// every fact here (role, company) is already known, never invented.
const NUDGE_LINES = [
  "Just floating this back to the top of your inbox in case it got buried — still very interested in connecting.",
  "Following up once more on the note below — happy to share more detail if useful, no worries if now isn't the right time.",
  "Last check-in from me on this one. If the timing isn't right, no problem at all — wishing you well either way.",
];

function buildFollowUpBody(coldEmail: string, sequenceNumber: number, roleTitle: string, company: string): string {
  const nudge = NUDGE_LINES[sequenceNumber - 1] ?? NUDGE_LINES[NUDGE_LINES.length - 1]!;
  return `${nudge}\n\n---\n\nRe: ${roleTitle} at ${company}\n\n${coldEmail}`;
}

async function scheduleNext(
  userId: string,
  outreachDraftId: string,
  contactId: string,
  sequenceNumber: number,
): Promise<void> {
  const dayOffset = FOLLOW_UP_DAYS[sequenceNumber - 1];
  if (sequenceNumber > MAX_FOLLOW_UPS || dayOffset === undefined) return;

  const scheduledFor = new Date(Date.now() + dayOffset * 86_400_000);
  const followUp = await OutreachFollowUpModel.create({
    userId,
    outreachDraftId,
    contactId,
    sequenceNumber,
    scheduledFor,
  });

  await outreachFollowUpQueue.add(
    "send",
    { followUpId: followUp._id.toString(), outreachDraftId, contactId, userId, sequenceNumber },
    { delay: dayOffset * 86_400_000, jobId: followUp._id.toString() },
  );
}

/**
 * Fires one scheduled follow-up (day 3, 7, or 14). Re-checks `cancelled`
 * immediately before sending — a reply can arrive during the delay window,
 * and `markReplied` only flips that flag, it doesn't reach into BullMQ to
 * pull the job — so this is the actual enforcement point, matching
 * sendCampaignEmail.ts's own stop-on-reply check. Send failures propagate
 * (SkipSend is the one exception) so BullMQ retries with backoff; the
 * queue's "failed" listener records the terminal state once retries are
 * exhausted, same split as sendCampaignEmail.ts/markEmailLogFailed.
 */
export async function sendOutreachFollowUp(data: OutreachFollowUpJobData): Promise<void> {
  const followUp = await OutreachFollowUpModel.findById(data.followUpId);
  if (!followUp) throw new SkipSend("Follow-up no longer exists");
  if (followUp.sent || followUp.cancelled) return;

  const [draft, contact] = await Promise.all([
    OutreachDraftModel.findById(data.outreachDraftId),
    ContactModel.findById(data.contactId),
  ]);
  if (!draft || !contact) throw new SkipSend("Draft or contact no longer exists");

  const jobIntel = await JobIntelModel.findById(draft.jobIntelId);
  if (!jobIntel) throw new SkipSend("Job analysis no longer exists");

  const stillUnsubscribed =
    !contact.subscribed || (await UnsubscribeRecordModel.exists({ userId: data.userId, email: contact.email }));
  if (stillUnsubscribed) {
    await OutreachSendLogModel.create({
      userId: data.userId,
      outreachDraftId: data.outreachDraftId,
      contactId: data.contactId,
      channel: "email",
      status: "suppressed",
      contentType: "follow_up",
      errorMessage: "Recipient has unsubscribed.",
    });
    await OutreachFollowUpModel.findByIdAndUpdate(followUp._id, { sent: true });
    return;
  }

  const coldEmail = draft.editedText?.coldEmail ?? draft.coldEmail;
  const body = buildFollowUpBody(coldEmail, data.sequenceNumber, jobIntel.roleTitle, jobIntel.company);
  const subject = `Re: Regarding the ${jobIntel.roleTitle} role at ${jobIntel.company}`;

  const [sender, provider] = await Promise.all([UserModel.findById(data.userId), resolveProvider(data.userId)]);
  if (!sender) throw new SkipSend("Sender account not found");

  const result = await provider.sendEmail({
    from: sender.email,
    to: contact.email,
    subject,
    html: body.replace(/\n/g, "<br/>"),
    text: body,
  });

  await OutreachSendLogModel.create({
    userId: data.userId,
    outreachDraftId: data.outreachDraftId,
    contactId: data.contactId,
    channel: "email",
    status: "sent",
    contentType: "follow_up",
    sentAt: new Date(),
    providerMessageId: result.providerMessageId,
  });

  await OutreachFollowUpModel.findByIdAndUpdate(followUp._id, { sent: true });
  await scheduleNext(data.userId, data.outreachDraftId, data.contactId, data.sequenceNumber + 1);
}

/** Called by the queue's failed handler once retries are exhausted — mirrors
 * markEmailLogFailed. Marks the slot resolved (sent stays false, but no
 * further automatic retry) and records why. */
export async function markOutreachFollowUpFailed(data: OutreachFollowUpJobData, errorMessage: string): Promise<void> {
  await OutreachSendLogModel.create({
    userId: data.userId,
    outreachDraftId: data.outreachDraftId,
    contactId: data.contactId,
    channel: "email",
    status: "failed",
    contentType: "follow_up",
    errorMessage,
  });
}
