import type { Request, Response } from "express";
import { CAMPAIGN_STATUSES, createCampaignSchema, updateCampaignSchema } from "@believe-ai/shared";
import { z } from "zod";
import { campaignService } from "../services/campaign.service.js";
import { auditService } from "../services/audit.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const listQuerySchema = z.object({
  status: z.enum(CAMPAIGN_STATUSES).optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export const campaignController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const q = listQuerySchema.parse(req.query);
    sendSuccess(res, await campaignService.list(req.userId!, q.status));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await campaignService.getById(req.params.id!, req.userId!));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createCampaignSchema.parse(req.body);
    const campaign = await campaignService.create(req.userId!, input);
    await auditService.record(req, {
      action: "campaign.created",
      entityType: "campaign",
      entityId: campaign.id,
      metadata: { name: campaign.name, audienceSize: campaign.audienceContactIds.length },
    });
    sendSuccess(res, campaign, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updateCampaignSchema.parse(req.body);
    sendSuccess(res, await campaignService.update(req.params.id!, req.userId!, input));
  }),

  launch: asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.launch(req.params.id!, req.userId!);
    await auditService.record(req, {
      action: "campaign.launched",
      entityType: "campaign",
      entityId: campaign.id,
      metadata: { name: campaign.name, status: campaign.status },
    });
    sendSuccess(res, campaign);
  }),

  pause: asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.pause(req.params.id!, req.userId!);
    await auditService.record(req, {
      action: "campaign.paused",
      entityType: "campaign",
      entityId: campaign.id,
      metadata: { name: campaign.name },
    });
    sendSuccess(res, campaign);
  }),

  resume: asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.resume(req.params.id!, req.userId!);
    await auditService.record(req, {
      action: "campaign.resumed",
      entityType: "campaign",
      entityId: campaign.id,
      metadata: { name: campaign.name },
    });
    sendSuccess(res, campaign);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const campaign = await campaignService.cancel(req.params.id!, req.userId!);
    await auditService.record(req, {
      action: "campaign.cancelled",
      entityType: "campaign",
      entityId: campaign.id,
      metadata: { name: campaign.name },
    });
    sendSuccess(res, campaign);
  }),

  analytics: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await campaignService.getAnalytics(req.params.id!, req.userId!));
  }),

  recipients: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paginationSchema.parse(req.query);
    sendSuccess(res, await campaignService.listRecipients(req.params.id!, req.userId!, page, limit));
  }),

  markReplied: asyncHandler(async (req: Request, res: Response) => {
    await campaignService.markReplied(req.params.id!, req.params.contactId!, req.userId!);
    sendSuccess(res, { marked: true });
  }),
};
