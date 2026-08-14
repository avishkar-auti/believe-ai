import type { Request, Response } from "express";
import { z } from "zod";
import { createDiscussionSchema, createReplySchema } from "@believe-ai/shared";
import { discussionService } from "../services/discussion.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export const discussionController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = paginationSchema.parse(req.query);
    sendSuccess(res, await discussionService.list(req.userId!, page, limit));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await discussionService.getById(req.params.id!, req.userId!));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createDiscussionSchema.parse(req.body);
    const discussion = await discussionService.create(req.userId!, req.userName!, input);
    sendSuccess(res, discussion, 201);
  }),

  addReply: asyncHandler(async (req: Request, res: Response) => {
    const input = createReplySchema.parse(req.body);
    const discussion = await discussionService.addReply(req.params.id!, req.userId!, req.userName!, input.body);
    sendSuccess(res, discussion, 201);
  }),

  toggleUpvote: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await discussionService.toggleUpvote(req.params.id!, req.userId!));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await discussionService.delete(req.params.id!, req.userId!);
    sendSuccess(res, { deleted: true });
  }),
};
