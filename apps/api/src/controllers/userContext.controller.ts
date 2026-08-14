import type { Request, Response } from "express";
import { updateUserContextSchema } from "@believe-ai/shared";
import { userContextService } from "../services/userContext.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const userContextController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await userContextService.getById(req.userId!));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updateUserContextSchema.parse(req.body);
    sendSuccess(res, await userContextService.update(req.userId!, input));
  }),
};
