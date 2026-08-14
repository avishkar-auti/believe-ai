import type { Request, Response } from "express";
import { ERROR_CODES } from "@believe-ai/shared";
import { sendError } from "../utils/apiResponse.js";

export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(res, 404, ERROR_CODES.NOT_FOUND, `Route ${req.method} ${req.path} not found`);
}
