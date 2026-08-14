import { randomBytes } from "node:crypto";
import type { HydratedDocument } from "mongoose";
import {
  CAMPAIGN_STATUS_TRANSITIONS,
  type Campaign,
  type CampaignAnalytics,
  type CampaignStatus,
  type CreateCampaignInput,
  type EmailLogStatus,
  type PaginatedResult,
  type UpdateCampaignInput,
} from "@believe-ai/shared";
import type { CampaignDocument } from "@believe-ai/server";
import { campaignRepository } from "../repositories/campaign.repository.js";
import { emailLogRepository } from "../repositories/emailLog.repository.js";
import { contactRepository } from "../repositories/contact.repository.js";
import { unsubscribeRepository } from "../repositories/unsubscribe.repository.js";
import { templateRepository } from "../repositories/template.repository.js";
import { emailQueue } from "../queues/emailQueue.js";
import { usageService } from "./usage.service.js";
import { InvalidStateTransitionError, NotFoundError, ValidationError } from "../errors/AppError.js";

function toDto(doc: HydratedDocument<CampaignDocument>): Campaign {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    subject: doc.subject,
    templateId: doc.templateId.toString(),
    audienceContactIds: doc.audienceContactIds.map((id) => id.toString()),
    status: doc.status as CampaignStatus,
    scheduledAt: doc.scheduledAt ? doc.scheduledAt.toISOString() : null,
    timezone: doc.timezone,
    dailyLimit: doc.dailyLimit,
    personalizationEnabled: doc.personalizationEnabled,
    trackingEnabled: doc.trackingEnabled,
    followUps: doc.followUps.map((f) => ({
      templateId: f.templateId.toString(),
      delayDays: f.delayDays,
      subjectOverride: f.subjectOverride ?? null,
    })),
    stopOnReply: doc.stopOnReply,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function assertTransition(from: CampaignStatus, to: CampaignStatus): void {
  if (!CAMPAIGN_STATUS_TRANSITIONS[from].includes(to)) {
    throw new InvalidStateTransitionError(`Cannot move a campaign from ${from} to ${to}`);
  }
}

export const campaignService = {
  toDto,

  async list(userId: string, status?: CampaignStatus): Promise<Campaign[]> {
    const docs = await campaignRepository.list(userId, status);
    return docs.map(toDto);
  },

  async getById(id: string, userId: string): Promise<Campaign> {
    const doc = await campaignRepository.findById(id, userId);
    if (!doc) throw new NotFoundError("Campaign not found");
    return toDto(doc);
  },

  async create(userId: string, input: CreateCampaignInput): Promise<Campaign> {
    await usageService.assertCanCreateCampaign(userId);

    const template = await templateRepository.findById(input.templateId, userId);
    if (!template) throw new ValidationError("Template not found");

    const contacts = await contactRepository.findManyByIds(input.audienceContactIds, userId);
    if (contacts.length !== input.audienceContactIds.length) {
      throw new ValidationError("Some contacts in the audience were not found");
    }

    if (input.followUps.length > 0) {
      const followUpTemplates = await Promise.all(
        input.followUps.map((f) => templateRepository.findById(f.templateId, userId)),
      );
      if (followUpTemplates.some((t) => !t)) {
        throw new ValidationError("One or more follow-up templates were not found");
      }
    }

    const doc = await campaignRepository.create({
      userId,
      name: input.name,
      subject: input.subject,
      templateId: input.templateId,
      audienceContactIds: input.audienceContactIds,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      timezone: input.timezone,
      dailyLimit: input.dailyLimit,
      personalizationEnabled: input.personalizationEnabled,
      trackingEnabled: input.trackingEnabled,
      followUps: input.followUps.map((f) => ({
        templateId: f.templateId,
        delayDays: f.delayDays,
        subjectOverride: f.subjectOverride ?? null,
      })),
      stopOnReply: input.stopOnReply,
    });
    return toDto(doc);
  },

  async update(id: string, userId: string, input: UpdateCampaignInput): Promise<Campaign> {
    const existing = await campaignRepository.findById(id, userId);
    if (!existing) throw new NotFoundError("Campaign not found");
    if (existing.status !== "DRAFT") {
      throw new InvalidStateTransitionError("Only draft campaigns can be edited");
    }
    const doc = await campaignRepository.update(id, userId, {
      ...input,
      scheduledAt: input.scheduledAt !== undefined ? (input.scheduledAt ? new Date(input.scheduledAt) : null) : undefined,
      followUps: input.followUps?.map((f) => ({
        templateId: f.templateId,
        delayDays: f.delayDays,
        subjectOverride: f.subjectOverride ?? null,
      })),
    });
    if (!doc) throw new NotFoundError("Campaign not found");
    return toDto(doc);
  },

  /**
   * Creates one EmailLog per sendable recipient (skipping anyone unsubscribed
   * or previously suppressed — spec 5.22) and schedules a queue job for each,
   * spaced out across dailyLimit with jitter so sends never burst (spec 37).
   */
  async launch(id: string, userId: string): Promise<Campaign> {
    const doc = await campaignRepository.findById(id, userId);
    if (!doc) throw new NotFoundError("Campaign not found");

    const isFutureSchedule = Boolean(doc.scheduledAt && doc.scheduledAt.getTime() > Date.now());
    const targetStatus: CampaignStatus = isFutureSchedule ? "SCHEDULED" : "RUNNING";
    assertTransition(doc.status as CampaignStatus, targetStatus);

    const contactIds = doc.audienceContactIds.map((cid) => cid.toString());
    const contacts = await contactRepository.findManyByIds(contactIds, userId);
    const unsubscribedEmails = await unsubscribeRepository.findUnsubscribedEmails(
      userId,
      contacts.map((c) => c.email),
    );
    const sendable = contacts.filter((c) => c.subscribed && !unsubscribedEmails.has(c.email));

    if (sendable.length === 0) {
      throw new ValidationError("No sendable recipients — all contacts are unsubscribed or excluded");
    }

    // Launch-time guard against the plan's daily allowance. The queue still
    // paces the actual sends via dailyLimit; this stops a launch that would
    // blow through the plan cap before any of it goes out.
    await usageService.assertCanSendEmails(userId, sendable.length);

    const logs = await emailLogRepository.insertMany(
      sendable.map((c) => ({
        campaignId: id,
        contactId: c._id.toString(),
        userId,
        trackingToken: randomBytes(16).toString("hex"),
      })),
    );

    const spacingMs = Math.max(1, Math.floor(86_400_000 / Math.max(doc.dailyLimit, 1)));
    const baseDelayMs = isFutureSchedule ? Math.max(0, doc.scheduledAt!.getTime() - Date.now()) : 0;

    await Promise.all(
      logs.map((log, index) => {
        const jitterMs = Math.floor(Math.random() * 5000);
        return emailQueue.add(
          "send",
          {
            emailLogId: log._id.toString(),
            campaignId: id,
            contactId: log.contactId.toString(),
            userId,
            stepIndex: 0,
          },
          { delay: baseDelayMs + index * spacingMs + jitterMs, jobId: log._id.toString() },
        );
      }),
    );

    const updated = await campaignRepository.setStatus(id, userId, targetStatus);
    return toDto(updated!);
  },

  async pause(id: string, userId: string): Promise<Campaign> {
    const existing = await campaignRepository.findById(id, userId);
    if (!existing) throw new NotFoundError("Campaign not found");
    assertTransition(existing.status as CampaignStatus, "PAUSED");
    const doc = await campaignRepository.setStatus(id, userId, "PAUSED");
    return toDto(doc!);
  },

  /**
   * Resuming re-enqueues every recipient still stuck at QUEUED. Jobs that
   * were already delayed and fired while paused get skipped by the worker
   * (it checks campaign status at send time) rather than sent — so they
   * need a fresh job here or they'd never go out.
   */
  async resume(id: string, userId: string): Promise<Campaign> {
    const existing = await campaignRepository.findById(id, userId);
    if (!existing) throw new NotFoundError("Campaign not found");
    assertTransition(existing.status as CampaignStatus, "RUNNING");

    const doc = await campaignRepository.setStatus(id, userId, "RUNNING");

    const stillQueued = await emailLogRepository.findQueuedByCampaign(id);
    const spacingMs = Math.max(1, Math.floor(86_400_000 / Math.max(existing.dailyLimit, 1)));
    await Promise.all(
      stillQueued.map((log, index) => {
        const jitterMs = Math.floor(Math.random() * 5000);
        return emailQueue.add(
          "send",
          {
            emailLogId: log._id.toString(),
            campaignId: id,
            contactId: log.contactId.toString(),
            userId,
            stepIndex: log.stepIndex,
          },
          { delay: index * spacingMs + jitterMs, jobId: `${log._id.toString()}-resume-${Date.now()}` },
        );
      }),
    );

    return toDto(doc!);
  },

  async cancel(id: string, userId: string): Promise<Campaign> {
    const existing = await campaignRepository.findById(id, userId);
    if (!existing) throw new NotFoundError("Campaign not found");
    assertTransition(existing.status as CampaignStatus, "CANCELLED");
    const doc = await campaignRepository.setStatus(id, userId, "CANCELLED");
    return toDto(doc!);
  },

  async getAnalytics(id: string, userId: string): Promise<CampaignAnalytics> {
    await this.getById(id, userId);
    const rows = await emailLogRepository.aggregateByCampaign(id);
    const counts: Partial<Record<EmailLogStatus, number>> = {};
    for (const row of rows) counts[row._id as EmailLogStatus] = row.count;

    const sent =
      (counts.SENT ?? 0) +
      (counts.DELIVERED ?? 0) +
      (counts.OPENED ?? 0) +
      (counts.CLICKED ?? 0) +
      (counts.REPLIED ?? 0);
    const delivered = sent;
    const opened = (counts.OPENED ?? 0) + (counts.CLICKED ?? 0) + (counts.REPLIED ?? 0);
    const clicked = (counts.CLICKED ?? 0) + (counts.REPLIED ?? 0);
    const replied = counts.REPLIED ?? 0;
    const bounced = counts.BOUNCED ?? 0;
    const failed = counts.FAILED ?? 0;

    const rate = (numerator: number, denominator: number) =>
      denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

    return {
      sent,
      delivered,
      opened,
      clicked,
      replied,
      bounced,
      failed,
      openRate: rate(opened, sent),
      clickRate: rate(clicked, sent),
      replyRate: rate(replied, sent),
      bounceRate: rate(bounced, sent),
    };
  },

  async listRecipients(id: string, userId: string, page: number, limit: number) {
    await this.getById(id, userId);
    const [items, total] = await emailLogRepository.list(id, page, limit);
    const result: PaginatedResult<(typeof items)[number]> = {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
    return result;
  },

  /**
   * There's no inbound-email integration yet, so reply detection is manual:
   * the user marks a recipient as replied, which stops any further
   * follow-up steps for that contact (checked by the worker before each
   * follow-up send) when the campaign has stopOnReply enabled.
   */
  async markReplied(id: string, contactId: string, userId: string): Promise<void> {
    await this.getById(id, userId);
    const log = await emailLogRepository.findLatestForContact(id, contactId);
    if (!log) throw new NotFoundError("No email has been sent to this contact for this campaign");
    await emailLogRepository.markReplied(log._id.toString());
  },
};
