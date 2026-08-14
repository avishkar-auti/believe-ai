import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "@believe-ai/shared";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";
import { logger } from "../config/logger.js";
import { sendError } from "../utils/apiResponse.js";
import { env } from "../config/env.js";

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, err.message);
    }
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, err.issues.map((i) => i.message).join("; "));
    return;
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  sendError(
    res,
    500,
    ERROR_CODES.INTERNAL_ERROR,
    env.NODE_ENV === "production" ? "Something went wrong" : String(err),
  );
}
