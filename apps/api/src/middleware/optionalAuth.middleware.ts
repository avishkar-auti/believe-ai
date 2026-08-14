import type { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../config/firebase.js";
import { userRepository } from "../repositories/user.repository.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Like authMiddleware, but never rejects the request — a missing, malformed,
 * or expired token just means the request proceeds as anonymous (req.userId
 * stays undefined). Only for routes explicitly documented as "auth optional"
 * (feedback today); nothing else should relax this.
 */
export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  try {
    const decoded = await firebaseAuth.verifyIdToken(header.slice("Bearer ".length));
    const user = await userRepository.findByFirebaseUid(decoded.uid);
    if (user) {
      req.userId = user._id.toString();
      req.firebaseUid = decoded.uid;
      req.userName = user.name || user.email;
    }
  } catch {
    // Invalid/expired token on an optional-auth route — proceed anonymous rather than reject.
  }
  next();
});
