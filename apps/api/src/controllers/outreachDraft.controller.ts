import type { Request, Response } from "express";
import { z } from "zod";
import { outreachDraftService } from "../services/outreachDraft.service.js";
import { outreachSendService } from "../services/outreachSend.service.js";
import { auditService } from "../services/audit.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const generateSchema = z.object({
  jobIntelId: z.string().trim().min(1),
  contactIds: z.array(z.string().trim().min(1)).min(1),
});

const decideSchema = z.object({
  status: z.enum(["approved", "edited", "rejected"]),
  editedText: z
    .object({
      coldEmail: z.string().optional(),
      linkedinNote: z.string().optional(),
      referralRequest: z.string().optional(),
      coverLetter: z.string().optional(),
    })
    .nullish(),
});

export const outreachDraftController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const input = generateSchema.parse(req.body);
    const result = await outreachDraftService.generate(
      req.userId!,
      req.headers.authorization!,
      input.jobIntelId,
      input.contactIds,
    );
    await auditService.record(req, { action: "outreach_draft.generated", entityType: "outreach_draft", entityId: input.jobIntelId });
    sendSuccess(res, result, 201);
  }),

  listByJobIntel: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await outreachDraftService.listByJobIntel(req.params.jobIntelId!, req.userId!));
  }),

  decide: asyncHandler(async (req: Request, res: Response) => {
    const input = decideSchema.parse(req.body);
    const result = await outreachDraftService.decide(req.params.id!, req.userId!, input.status, input.editedText ?? null);
    await auditService.record(req, { action: "outreach_draft.decided", entityType: "outreach_draft", entityId: result.id });
    sendSuccess(res, result);
  }),

  send: asyncHandler(async (req: Request, res: Response) => {
    const result = await outreachSendService.send(req.userId!, req.params.id!);
    await auditService.record(req, { action: "outreach_draft.sent", entityType: "outreach_draft", entityId: req.params.id! });
    sendSuccess(res, result);
  }),

  listSendLogs: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await outreachSendService.listSendLogs(req.params.id!, req.userId!));
  }),

  listFollowUps: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await outreachSendService.listFollowUps(req.params.id!, req.userId!));
  }),

  markReplied: asyncHandler(async (req: Request, res: Response) => {
    await outreachSendService.markReplied(req.params.id!, req.userId!);
    await auditService.record(req, { action: "outreach_draft.replied", entityType: "outreach_draft", entityId: req.params.id! });
    sendSuccess(res, { marked: true });
  }),
};
