import type { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../config/firebase.js";
import { userService } from "../services/user.service.js";
import { AuthenticationError } from "../errors/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Verifies the Firebase ID token on every request and resolves it to our
 * own Mongo user id. Never trust a userId supplied by the client directly —
 * this is the only place req.userId is set.
 */
export const authMiddleware = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing bearer token");
    }
    const token = header.slice("Bearer ".length);

    let decoded;
    try {
      decoded = await firebaseAuth.verifyIdToken(token);
    } catch {
      throw new AuthenticationError("Invalid or expired token");
    }

    const user = await userService.findOrCreateByFirebaseUid({
      firebaseUid: decoded.uid,
      email: decoded.email ?? "",
      name: decoded.name ?? "",
      avatar: decoded.picture ?? null,
    });

    req.userId = user._id.toString();
    req.firebaseUid = decoded.uid;
    req.userName = user.name || user.email;
    next();
  },
);
