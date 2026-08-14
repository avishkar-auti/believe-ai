import type { Request, Response } from "express";
import { createTemplateSchema, updateTemplateSchema } from "@believe-ai/shared";
import { z } from "zod";
import { templateService } from "../services/template.service.js";
import { auditService } from "../services/audit.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const previewSchema = z.object({
  subject: z.string(),
  body: z.string(),
  values: z.record(z.string(), z.string()).default({}),
});

export const templateController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await templateService.list(req.userId!));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await templateService.getById(req.params.id!, req.userId!));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createTemplateSchema.parse(req.body);
    sendSuccess(res, await templateService.create(req.userId!, input), 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updateTemplateSchema.parse(req.body);
    sendSuccess(res, await templateService.update(req.params.id!, req.userId!, input));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await templateService.delete(req.params.id!, req.userId!);
    await auditService.record(req, {
      action: "template.deleted",
      entityType: "template",
      entityId: req.params.id!,
    });
    sendSuccess(res, { deleted: true });
  }),

  duplicate: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await templateService.duplicate(req.params.id!, req.userId!), 201);
  }),

  preview: asyncHandler(async (req: Request, res: Response) => {
    const input = previewSchema.parse(req.body);
    sendSuccess(res, templateService.preview(input.subject, input.body, input.values));
  }),
};
