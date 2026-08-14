import type { NextFunction, Request, Response } from "express";
import { userRepository } from "../repositories/user.repository.js";
import { AuthorizationError } from "../errors/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Gates job-posting management routes. Must run after authMiddleware (needs
 * req.userId already resolved) — checks the role stored on the user's own
 * document rather than trusting anything from the request itself.
 */
export const requireRecruiter = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const user = await userRepository.findById(req.userId!);
  if (!user || (user.role !== "recruiter" && user.role !== "admin")) {
    throw new AuthorizationError("Recruiter access required — enable it in Settings first");
  }
  next();
});
