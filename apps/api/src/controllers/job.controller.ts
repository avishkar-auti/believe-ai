import type { Request, Response } from "express";
import { z } from "zod";
import { createJobSchema, updateJobSchema, type Job } from "@believe-ai/shared";
import { jobService } from "../services/job.service.js";
import { auditService } from "../services/audit.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const searchSchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  company: z.string().optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]).optional(),
  experienceLevel: z.enum(["fresher", "junior", "mid", "senior", "lead"]).optional(),
  skill: z.string().optional(),
  source: z.enum(["internal", "jsearch"]).optional(),
  salaryMin: z.coerce.number().nonnegative().optional(),
  datePosted: z.enum(["any", "24h", "7d", "30d"]).optional(),
  savedOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

const saveBodySchema = z.object({
  job: z.custom<Job>().optional(),
});

export const jobController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...filters } = searchSchema.parse(req.query);
    sendSuccess(res, await jobService.search(filters, page, limit, req.userId!));
  }),

  filters: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await jobService.getFilterOptions());
  }),

  toggleSave: asyncHandler(async (req: Request, res: Response) => {
    const { job } = saveBodySchema.parse(req.body);
    sendSuccess(res, await jobService.toggleSave(req.userId!, req.params.id!, job));
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await jobService.listMine(req.userId!));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await jobService.getById(req.params.id!));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createJobSchema.parse(req.body);
    const job = await jobService.create(req.userId!, input);
    await auditService.record(req, { action: "job.created", entityType: "job", entityId: job.id });
    sendSuccess(res, job, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updateJobSchema.parse(req.body);
    const job = await jobService.update(req.params.id!, req.userId!, input);
    await auditService.record(req, { action: "job.updated", entityType: "job", entityId: job.id });
    sendSuccess(res, job);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await jobService.delete(req.params.id!, req.userId!);
    await auditService.record(req, { action: "job.deleted", entityType: "job", entityId: req.params.id! });
    sendSuccess(res, { deleted: true });
  }),
};
