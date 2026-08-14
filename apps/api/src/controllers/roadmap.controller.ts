import type { Request, Response } from "express";
import { z } from "zod";
import { roadmapService } from "../services/roadmap.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

const generateSchema = z.object({
  goal: z.string().trim().min(1),
  personalize: z.boolean().default(true),
});

export const roadmapController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paginationSchema.parse(req.query);
    sendSuccess(res, await roadmapService.list(req.userId!, page, limit));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await roadmapService.getById(req.params.id!, req.userId!));
  }),

  generate: asyncHandler(async (req: Request, res: Response) => {
    const input = generateSchema.parse(req.body);
    const result = await roadmapService.generate(req.userId!, req.headers.authorization!, input.goal, input.personalize);
    sendSuccess(res, result, 201);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await roadmapService.delete(req.params.id!, req.userId!);
    sendSuccess(res, { deleted: true });
  }),
};
