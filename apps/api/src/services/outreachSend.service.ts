import type { HydratedDocument } from "mongoose";
import { FOLLOW_UP_DAYS, MAX_FOLLOW_UPS, type OutreachFollowUp, type OutreachSendLog } from "@believe-ai/shared";
import {
  ContactModel,
  OutreachDraftModel,
  UnsubscribeRecordModel,
  UserModel,
  type OutreachFollowUpDocument,
  type OutreachSendLogDocument,
} from "@believe-ai/server";
import { outreachSendLogRepository } from "../repositories/outreachSendLog.repository.js";
import { outreachFollowUpRepository } from "../repositories/outreachFollowUp.repository.js";
import { jobIntelRepository } from "../repositories/jobIntel.repository.js";
import { resolveProvider } from "./emailProviderResolver.js";
import { outreachFollowUpQueue } from "../queues/outreachFollowUpQueue.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";
import { logger } from "../config/logger.js";

function toSendLogDto(doc: HydratedDocument<OutreachSendLogDocument>): OutreachSendLog {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    outreachDraftId: doc.outreachDraftId.toString(),
    contactId: doc.contactId.toString(),
    channel: doc.channel as OutreachSendLog["channel"],
    status: doc.status as OutreachSendLog["status"],
    contentType: (doc.contentType as OutreachSendLog["contentType"]) ?? null,
    sentAt: doc.sentAt ? doc.sentAt.toISOString() : null,
    errorMessage: doc.errorMessage ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

function toFollowUpDto(doc: HydratedDocument<OutreachFollowUpDocument>): OutreachFollowUp {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    outreachDraftId: doc.outreachDraftId.toString(),
    contactId: doc.contactId.toString(),
    sequenceNumber: doc.sequenceNumber,
    scheduledFor: doc.scheduledFor.toISOString(),
    sent: doc.sent,
    cancelled: doc.cancelled,
    cancelReason: doc.cancelReason ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function scheduleFollowUp(
  userId: string,
  outreachDraftId: string,
  contactId: string,
  sequenceNumber: number,
): Promise<void> {
  const dayOffset = FOLLOW_UP_DAYS[sequenceNumber - 1];
  if (sequenceNumber > MAX_FOLLOW_UPS || dayOffset === undefined) return;

  const scheduledFor = new Date(Date.now() + dayOffset * 86_400_000);
  const followUp = await outreachFollowUpRepository.create({
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

export const outreachSendService = {
  toSendLogDto,
  toFollowUpDto,

  /**
   * The enforcement point for human_approval_gate: only reachable for a
   * draft already marked approved/edited. Two channels, handled completely
   * differently on purpose (ported from HireConnect's send_logic.py):
   * - LinkedIn: always logged "drafted", NEVER sent automatically — the
   *   note text is already shown in the UI for the user to copy and send
   *   themselves. This status never transitions to "sent".
   * - Email: sent through the user's own connected Gmail/Outlook to the
   *   contact's real, already-verified email address (not an inferred
   *   pattern — unlike the reference implementation, every Contact here
   *   already has a real address, whether typed in directly or supplied
   *   when promoting a discovered JobLead). A successful send schedules the
   *   day-3 follow-up.
   */
  async send(userId: string, draftId: string): Promise<{ sendLogs: OutreachSendLog[] }> {
    const draft = await OutreachDraftModel.findOne({ _id: draftId, userId });
    if (!draft) throw new NotFoundError("Draft not found");
    if (draft.status !== "approved" && draft.status !== "edited") {
      throw new ValidationError("Only approved or edited drafts can be sent");
    }

    const existingLogs = await outreachSendLogRepository.listByDraft(draftId, userId);
    // Never re-send: once an email attempt actually reached "sent" or was
    // correctly "suppressed", clicking Send again must not risk a duplicate
    // email to the same contact. A prior "failed" attempt (e.g. no email
    // provider connected yet) is the one case worth retrying.
    if (existingLogs.some((log) => log.channel === "email" && (log.status === "sent" || log.status === "suppressed"))) {
      throw new ValidationError("This draft has already been sent");
    }

    const [contact, jobIntel] = await Promise.all([
      ContactModel.findById(draft.contactId),
      jobIntelRepository.findById(draft.jobIntelId.toString(), userId),
    ]);
    if (!contact || !jobIntel) throw new NotFoundError("Contact or job analysis no longer exists");

    // The LinkedIn "drafted" record is permanent and only ever logged once —
    // a retry of the email side shouldn't duplicate it.
    const existingLinkedinLog = existingLogs.find((log) => log.channel === "linkedin");
    const linkedinLog =
      existingLinkedinLog ??
      (await outreachSendLogRepository.create({
        userId,
        outreachDraftId: draftId,
        contactId: contact._id.toString(),
        channel: "linkedin",
        status: "drafted",
        contentType: "linkedin_note",
        sentAt: null,
        errorMessage: null,
      }));

    const stillUnsubscribed =
      !contact.subscribed || (await UnsubscribeRecordModel.exists({ userId, email: contact.email }));
    if (stillUnsubscribed) {
      const suppressedLog = await outreachSendLogRepository.create({
        userId,
        outreachDraftId: draftId,
        contactId: contact._id.toString(),
        channel: "email",
        status: "suppressed",
        contentType: "cold_email",
        sentAt: null,
        errorMessage: "Recipient has unsubscribed.",
      });
      return { sendLogs: [linkedinLog, suppressedLog].map(toSendLogDto) };
    }

    const coldEmail = draft.editedText?.coldEmail ?? draft.coldEmail;
    const subject = `Regarding the ${jobIntel.roleTitle} role at ${jobIntel.company}`;

    let emailLog: HydratedDocument<OutreachSendLogDocument>;
    try {
      const [sender, provider] = await Promise.all([UserModel.findById(userId), resolveProvider(userId)]);
      if (!sender) throw new Error("Sender account not found");

      const result = await provider.sendEmail({
        from: sender.email,
        to: contact.email,
        subject,
        html: coldEmail.replace(/\n/g, "<br/>"),
        text: coldEmail,
      });

      emailLog = await outreachSendLogRepository.create({
        userId,
        outreachDraftId: draftId,
        contactId: contact._id.toString(),
        channel: "email",
        status: "sent",
        contentType: "cold_email",
        sentAt: new Date(),
        errorMessage: null,
        providerMessageId: result.providerMessageId,
      });

      await scheduleFollowUp(userId, draftId, contact._id.toString(), 1);
    } catch (err) {
      logger.warn({ err, draftId }, "outreachSend: email send failed");
      emailLog = await outreachSendLogRepository.create({
        userId,
        outreachDraftId: draftId,
        contactId: contact._id.toString(),
        channel: "email",
        status: "failed",
        contentType: "cold_email",
        sentAt: null,
        errorMessage: err instanceof Error ? err.message : "Send failed",
      });
    }

    return { sendLogs: [linkedinLog, emailLog].map(toSendLogDto) };
  },

  async listSendLogs(draftId: string, userId: string): Promise<OutreachSendLog[]> {
    const docs = await outreachSendLogRepository.listByDraft(draftId, userId);
    return docs.map(toSendLogDto);
  },

  async listFollowUps(draftId: string, userId: string): Promise<OutreachFollowUp[]> {
    const docs = await outreachFollowUpRepository.listByDraft(draftId, userId);
    return docs.map(toFollowUpDto);
  },

  /** Cancels every remaining follow-up for this draft's contact — the
   * manual reply-detection path (this codebase has no inbound-mail
   * integration, matching the existing Campaign stopOnReply/markReplied
   * pattern in campaign.service.ts). */
  async markReplied(draftId: string, userId: string): Promise<void> {
    const draft = await OutreachDraftModel.findOne({ _id: draftId, userId });
    if (!draft) throw new NotFoundError("Draft not found");
    await outreachFollowUpRepository.cancelPending(draftId, userId, "Contact replied");
  },

  /** Internal — called only by the worker's follow-up job. */
  scheduleNext: scheduleFollowUp,
};
