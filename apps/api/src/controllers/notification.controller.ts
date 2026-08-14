import type { Request, Response } from "express";
import { z } from "zod";
import { notificationService } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paginationSchema.parse(req.query);
    sendSuccess(res, await notificationService.list(req.userId!, page, limit));
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await notificationService.markRead(req.params.id!, req.userId!));
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const updated = await notificationService.markAllRead(req.userId!);
    sendSuccess(res, { updated });
  }),
};
