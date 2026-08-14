import { randomBytes } from "node:crypto";
import {
  CampaignModel,
  ContactModel,
  EmailLogModel,
  NotificationModel,
  TemplateModel,
  UnsubscribeRecordModel,
  UserContextModel,
  UserModel,
  rewriteLinksForTracking,
} from "@believe-ai/server";
import { formatUserContextForPrompt, interpolateTemplate, type EmailSendJobData, type UserContext } from "@believe-ai/shared";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { emailQueue } from "../queues/emailQueue.js";
import { personalizeViaAiService } from "./aiServiceClient.js";
import { resolveProvider } from "./emailProviderResolver.js";

class SkipSend extends Error {}

/**
 * Transitions a RUNNING campaign to COMPLETED once no recipients remain
 * queued. Called on every terminal outcome — sent, failed, or skipped — so
 * a campaign whose last recipient bounced still completes rather than
 * sitting in RUNNING forever.
 *
 * The `status: "RUNNING"` filter makes this a conditional update: two
 * workers finishing their last jobs concurrently can't both transition it,
 * and it can never resurrect a campaign the user just paused or cancelled.
 */
async function maybeCompleteCampaign(campaignId: string): Promise<void> {
  const remaining = await EmailLogModel.countDocuments({ campaignId, status: "QUEUED" });
  if (remaining > 0) return;

  const result = await CampaignModel.updateOne(
    { _id: campaignId, status: "RUNNING" },
    { $set: { status: "COMPLETED" } },
  );
  if (result.modifiedCount === 0) return;

  logger.info({ campaignId }, "campaign completed — no recipients remaining");

  // modifiedCount > 0 means this worker won the transition, so exactly one
  // notification is created even if several finish concurrently.
  const campaign = await CampaignModel.findById(campaignId);
  if (!campaign) return;
  try {
    await NotificationModel.create({
      userId: campaign.userId,
      type: "campaign.completed",
      title: "Campaign completed",
      body: `"${campaign.name}" has finished sending.`,
      link: `/app/campaigns/${campaignId}`,
    });
  } catch (err) {
    logger.error({ err, campaignId }, "Failed to create campaign completion notification");
  }
}

/** Marks one recipient failed, then re-checks whether the campaign is now done. */
async function failLog(emailLogId: string, campaignId: string, errorMessage: string): Promise<void> {
  await EmailLogModel.findByIdAndUpdate(emailLogId, { status: "FAILED", errorMessage });
  await maybeCompleteCampaign(campaignId);
}

/**
 * Schedules the next follow-up step, if the campaign has one configured
 * beyond the step that was just sent. Reply-detection is manual (no inbound
 * mail integration yet) — the actual stop-on-reply check happens when this
 * next step is about to send, not here, so a reply arriving during the
 * delay window still prevents the send.
 */
async function scheduleNextStep(data: EmailSendJobData, campaign: InstanceType<typeof CampaignModel>): Promise<void> {
  const nextFollowUp = campaign.followUps[data.stepIndex];
  if (!nextFollowUp) return;

  const nextStepIndex = data.stepIndex + 1;
  const nextLog = await EmailLogModel.create({
    campaignId: data.campaignId,
    contactId: data.contactId,
    userId: data.userId,
    stepIndex: nextStepIndex,
    trackingToken: randomBytes(16).toString("hex"),
    status: "QUEUED",
  });

  const delayMs = nextFollowUp.delayDays * 86_400_000 + Math.floor(Math.random() * 5000);
  await emailQueue.add(
    "send",
    {
      emailLogId: nextLog._id.toString(),
      campaignId: data.campaignId,
      contactId: data.contactId,
      userId: data.userId,
      stepIndex: nextStepIndex,
    },
    { delay: delayMs, jobId: nextLog._id.toString() },
  );
}

interface PersonalizationInput {
  personalizationEnabled: boolean;
  userId: string;
  subjectSource: string;
  templateBody: string;
  contact: InstanceType<typeof ContactModel>;
  values: Record<string, string | undefined>;
}

/**
 * Personalizes via the AI provider when the campaign has it enabled,
 * falling back to plain {{variable}} interpolation if personalization is
 * off or the AI call fails — a provider hiccup should never block a send
 * (spec 5.9: AI assists, never blocks the core workflow).
 */
async function buildPersonalizedContent(
  input: PersonalizationInput,
): Promise<{ subject: string; bodyHtml: string }> {
  const fallback = {
    subject: interpolateTemplate(input.subjectSource, input.values),
    bodyHtml: interpolateTemplate(input.templateBody, input.values),
  };

  if (!input.personalizationEnabled) return fallback;

  try {
    const profileDoc = await UserContextModel.findOne({ userId: input.userId });
    const profile: UserContext | null = profileDoc
      ? {
          userId: input.userId,
          aboutMe: profileDoc.aboutMe ?? null,
          companyInfo: profileDoc.companyInfo ?? null,
          servicesOrProducts: profileDoc.servicesOrProducts ?? null,
          skillsAndExperience: profileDoc.skillsAndExperience ?? null,
          achievements: profileDoc.achievements ?? null,
          targetAudience: profileDoc.targetAudience ?? null,
          updatedAt: profileDoc.updatedAt.toISOString(),
        }
      : null;

    const result = await personalizeViaAiService({
      templateSubject: input.subjectSource,
      templateBody: input.templateBody,
      contact: {
        firstName: input.contact.firstName,
        lastName: input.contact.lastName,
        company: input.contact.company ?? null,
        jobTitle: input.contact.jobTitle ?? null,
      },
      senderContext: formatUserContextForPrompt(profile),
    });
    return { subject: result.subject, bodyHtml: result.body };
  } catch (err) {
    logger.warn({ err, userId: input.userId }, "AI personalization failed, falling back to template interpolation");
    return fallback;
  }
}

/**
 * Processes a single queued recipient for one step of a campaign (the
 * initial send, or a follow-up). Re-checks suppression, campaign state, and
 * — for follow-ups — whether the recipient already replied, all at send
 * time since state can change between enqueue and delivery. Throws to let
 * BullMQ retry on transient failures; SkipSend short-circuits without
 * marking the log failed (already-processed logs).
 */
export async function sendCampaignEmail(data: EmailSendJobData): Promise<void> {
  const log = await EmailLogModel.findById(data.emailLogId);
  if (!log) throw new SkipSend("Email log no longer exists");
  if (log.status !== "QUEUED") return; // already handled by a previous attempt

  const campaign = await CampaignModel.findById(data.campaignId);
  if (!campaign || campaign.status !== "RUNNING") {
    logger.info({ campaignId: data.campaignId, status: campaign?.status }, "Skipping send — campaign not running");
    return;
  }

  if (campaign.stopOnReply && data.stepIndex > 0) {
    const priorReply = await EmailLogModel.exists({
      campaignId: data.campaignId,
      contactId: data.contactId,
      replied: true,
    });
    if (priorReply) {
      await failLog(log._id.toString(), data.campaignId, "Follow-up skipped — recipient already replied");
      return;
    }
  }

  const stepTemplateId =
    data.stepIndex === 0 ? campaign.templateId : campaign.followUps[data.stepIndex - 1]?.templateId;
  const subjectOverride =
    data.stepIndex === 0 ? null : (campaign.followUps[data.stepIndex - 1]?.subjectOverride ?? null);

  const [contact, template, sender] = await Promise.all([
    ContactModel.findById(data.contactId),
    stepTemplateId ? TemplateModel.findById(stepTemplateId) : null,
    UserModel.findById(data.userId),
  ]);

  if (!contact || !template || !sender) {
    await failLog(log._id.toString(), data.campaignId, "Missing contact, template, or sender at send time");
    return;
  }

  const stillUnsubscribed =
    !contact.subscribed || (await UnsubscribeRecordModel.exists({ userId: data.userId, email: contact.email }));
  if (stillUnsubscribed) {
    await failLog(log._id.toString(), data.campaignId, "Recipient is unsubscribed");
    return;
  }

  const values = {
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company ?? undefined,
    jobTitle: contact.jobTitle ?? undefined,
    senderName: sender.name || undefined,
    senderCompany: sender.company ?? undefined,
  };

  const subjectSource = data.stepIndex === 0 ? campaign.subject || template.subject : subjectOverride || template.subject;
  const { subject, bodyHtml } = await buildPersonalizedContent({
    personalizationEnabled: campaign.personalizationEnabled,
    userId: data.userId,
    subjectSource,
    templateBody: template.body,
    contact,
    values,
  });
  const trackingPixel = campaign.trackingEnabled
    ? `<img src="${env.API_BASE_URL}/api/v1/t/open/${log.trackingToken}" width="1" height="1" alt="" style="display:none" />`
    : "";
  const unsubscribeUrl = `${env.API_BASE_URL}/api/v1/t/unsubscribe/${log.trackingToken}`;

  // Route the body's links through the click-tracking endpoint. The unsubscribe
  // link is deliberately excluded — opting out must never look like engagement,
  // and it has to keep working even if tracking is off.
  const trackedBodyHtml = campaign.trackingEnabled
    ? rewriteLinksForTracking({
        html: bodyHtml,
        trackingToken: log.trackingToken,
        apiBaseUrl: env.API_BASE_URL,
        encryptionKey: env.ENCRYPTION_KEY,
        skipUrls: [unsubscribeUrl],
      })
    : bodyHtml;

  const html = `${trackedBodyHtml}${trackingPixel}<p style="font-size:12px;color:#888;margin-top:24px">
    <a href="${unsubscribeUrl}">Unsubscribe</a></p>`;
  // The plain-text alternative keeps the original links — a text-only client
  // can't be click-tracked anyway, and bare redirect URLs read as suspicious.
  const text = `${bodyHtml.replace(/<[^>]+>/g, "")}\n\nUnsubscribe: ${unsubscribeUrl}`;

  const provider = await resolveProvider(data.userId);

  // Let send failures propagate so BullMQ retries with backoff; the queue's
  // "failed" listener marks the log FAILED only once retries are exhausted,
  // so a transient provider hiccup doesn't permanently fail a recipient.
  const result = await provider.sendEmail({ from: sender.email, to: contact.email, subject, html, text });
  await EmailLogModel.findByIdAndUpdate(log._id, {
    status: "SENT",
    providerMessageId: result.providerMessageId,
    sentAt: new Date(),
  });

  // Must run before the completion check — it may queue a follow-up, and a
  // campaign with a pending follow-up isn't finished.
  await scheduleNextStep(data, campaign);
  await maybeCompleteCampaign(data.campaignId);
}

/** Called by the queue's failed handler once retries are exhausted. */
export async function markEmailLogFailed(emailLogId: string, errorMessage: string): Promise<void> {
  const log = await EmailLogModel.findByIdAndUpdate(emailLogId, { status: "FAILED", errorMessage }, { new: true });
  if (log) await maybeCompleteCampaign(log.campaignId.toString());
}
