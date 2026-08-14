import type { Request, Response } from "express";
import { resumeService } from "../services/resume.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ValidationError } from "../errors/AppError.js";

export const resumeController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const resume = await resumeService.getByUserId(req.userId!);
    sendSuccess(res, resume);
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError("Resume file is required (field name: file)");
    const resume = await resumeService.upload(req.userId!, req.file, req.headers.authorization!);
    sendSuccess(res, resume, 201);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await resumeService.delete(req.userId!);
    sendSuccess(res, { deleted: true });
  }),
};
