import type { Request, Response } from "express";
import { z } from "zod";
import { analyticsService } from "../services/analytics.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { campaignService } from "../services/campaign.service.js";

const emailsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const analyticsController = {
  dashboard: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await analyticsService.getDashboard(req.userId!));
  }),

  campaign: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await campaignService.getAnalytics(req.params.id!, req.userId!));
  }),

  emails: asyncHandler(async (req: Request, res: Response) => {
    const q = emailsQuerySchema.parse(req.query);
    sendSuccess(res, await analyticsService.getEmailTracking(req.userId!, q.page, q.limit));
  }),
};
