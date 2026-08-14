import type { Response } from "express";
import type { ApiErrorResponse, ApiSuccessResponse, ErrorCode } from "@believe-ai/shared";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode,
  message: string,
): void {
  const body: ApiErrorResponse = { success: false, error: { code, message } };
  res.status(statusCode).json(body);
}
