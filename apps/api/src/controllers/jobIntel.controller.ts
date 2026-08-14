import type { Request, Response } from "express";
import { z } from "zod";
import { jobIntelService } from "../services/jobIntel.service.js";
import { auditService } from "../services/audit.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

const analyzeSchema = z.object({
  jobUrl: z.string().trim().url(),
});

export const jobIntelController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paginationSchema.parse(req.query);
    sendSuccess(res, await jobIntelService.list(req.userId!, page, limit));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await jobIntelService.getById(req.params.id!, req.userId!));
  }),

  analyze: asyncHandler(async (req: Request, res: Response) => {
    const input = analyzeSchema.parse(req.body);
    const result = await jobIntelService.analyze(req.userId!, req.headers.authorization!, input.jobUrl);
    await auditService.record(req, { action: "job_intel.analyzed", entityType: "job_intel", entityId: result.id });
    sendSuccess(res, result, 201);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await jobIntelService.delete(req.params.id!, req.userId!);
    sendSuccess(res, { deleted: true });
  }),
};
