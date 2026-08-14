import type { Request, Response } from "express";
import { z } from "zod";
import { isAllowedRedirectProtocol, verifyTrackedUrl } from "@believe-ai/server";
import { env } from "../config/env.js";
import { trackingService } from "../services/tracking.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ValidationError } from "../errors/AppError.js";

// 1x1 transparent GIF used as the open-tracking pixel.
const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7", "base64");

/**
 * `u` is fully attacker-controlled by the time it reaches us, so it is only
 * honoured when accompanied by a valid HMAC (`s`) produced when the email was
 * built. Without that check this endpoint is an open redirect.
 */
const clickQuerySchema = z.object({ u: z.string().url(), s: z.string().min(1) });

export const trackingController = {
  open: asyncHandler(async (req: Request, res: Response) => {
    await trackingService.recordOpen(req.params.token!);
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "no-store");
    res.send(TRANSPARENT_GIF);
  }),

  click: asyncHandler(async (req: Request, res: Response) => {
    const parsed = clickQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new ValidationError("Missing or invalid redirect URL");

    const { u: destination, s: signature } = parsed.data;
    // Protocol allowlist first: z.string().url() happily accepts javascript:
    // and data: URLs, which must never reach res.redirect.
    if (!isAllowedRedirectProtocol(destination)) throw new ValidationError("Unsupported redirect protocol");
    if (!verifyTrackedUrl(destination, signature, env.ENCRYPTION_KEY)) {
      throw new ValidationError("Invalid tracking signature");
    }

    await trackingService.recordClick(req.params.token!);
    res.redirect(destination);
  }),

  unsubscribe: asyncHandler(async (req: Request, res: Response) => {
    await trackingService.unsubscribeByToken(req.params.token!);
    res
      .status(200)
      .type("html")
      .send(
        "<!doctype html><html><body style=\"font-family:sans-serif;text-align:center;padding:3rem\"><h1>You're unsubscribed</h1><p>You won't receive further emails from this sender.</p></body></html>",
      );
  }),
};
