import type { Request, Response } from "express";
import { z } from "zod";
import { userService } from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  timezone: z.string().min(1).optional(),
  onboardingCompleted: z.boolean().optional(),
  // Deliberately excludes "admin" — self-serve role changes can only ever
  // grant/revoke the recruiter posting privilege, never elevate to admin.
  role: z.enum(["user", "recruiter"]).optional(),
});

export const authController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.userId!);
    sendSuccess(res, user);
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const updates = updateProfileSchema.parse(req.body);
    const user = await userService.updateProfile(req.userId!, updates);
    sendSuccess(res, user);
  }),
};
