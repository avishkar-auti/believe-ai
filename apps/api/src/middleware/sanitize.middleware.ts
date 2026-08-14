import type { NextFunction, Request, Response } from "express";
import sanitize from "mongo-sanitize";

/** Strips Mongo operator keys ($gt, $where, ...) from user-controlled input before it reaches a query. */
export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
}
