import type { NextFunction, Request, Response } from "express";

type RequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async Express handler so rejected promises reach the error
 * middleware instead of crashing the process unhandled.
 */
export function asyncHandler(handler: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
