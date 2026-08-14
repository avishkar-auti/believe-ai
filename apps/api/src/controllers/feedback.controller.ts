import type { Request, Response } from "express";
import { createFeedbackSchema } from "@believe-ai/shared";
import { feedbackService } from "../services/feedback.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const feedbackController = {
  submit: asyncHandler(async (req: Request, res: Response) => {
    const input = createFeedbackSchema.parse(req.body);
    const feedback = await feedbackService.submit(req.userId ?? null, input);
    sendSuccess(res, feedback, 201);
  }),
};
