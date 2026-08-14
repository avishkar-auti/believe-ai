import type { Request, Response } from "express";
import { z } from "zod";
import { careerFitService } from "../services/careerFit.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

const generateSchema = z.object({
  targetRole: z.string().trim().min(1).optional(),
});

export const careerFitController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paginationSchema.parse(req.query);
    sendSuccess(res, await careerFitService.list(req.userId!, page, limit));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await careerFitService.getById(req.params.id!, req.userId!));
  }),

  generate: asyncHandler(async (req: Request, res: Response) => {
    const input = generateSchema.parse(req.body);
    const result = await careerFitService.generate(req.userId!, req.headers.authorization!, input.targetRole ?? null);
    sendSuccess(res, result, 201);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await careerFitService.delete(req.params.id!, req.userId!);
    sendSuccess(res, { deleted: true });
  }),
};
