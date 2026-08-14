import type { Request, Response } from "express";
import { usageService } from "../services/usage.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const usageController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await usageService.getUsage(req.userId!));
  }),
};
