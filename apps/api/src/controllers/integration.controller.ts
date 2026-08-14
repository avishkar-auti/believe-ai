import type { Request, Response } from "express";
import { z } from "zod";
import { integrationService } from "../services/integration.service.js";
import { auditService } from "../services/audit.service.js";
import { notificationService } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ValidationError } from "../errors/AppError.js";
import { env } from "../config/env.js";

const callbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const integrationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await integrationService.listStatus(req.userId!));
  }),

  connectGmail: asyncHandler(async (req: Request, res: Response) => {
    const url = integrationService.getGmailConsentUrl(req.userId!);
    sendSuccess(res, { url });
  }),

  /** Public redirect target from Google — not behind authMiddleware, user identity comes from state. */
  gmailCallback: asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = callbackQuerySchema.parse(req.query);
    if (!state) throw new ValidationError("Missing state");
    const { email } = await integrationService.handleGmailCallback(state, code);
    // `state` is the authenticated userId, threaded through Google's redirect.
    await auditService.record(req, {
      action: "integration.connected",
      entityType: "integration",
      metadata: { provider: "gmail", email },
      userId: state,
    });
    res.redirect(`${env.APP_BASE_URL}/settings/integrations?gmail=connected`);
  }),

  disconnectGmail: asyncHandler(async (req: Request, res: Response) => {
    await integrationService.disconnectGmail(req.userId!);
    await auditService.record(req, {
      action: "integration.disconnected",
      entityType: "integration",
      metadata: { provider: "gmail" },
    });
    await notificationService.create(req.userId!, {
      type: "integration.disconnected",
      title: "Gmail disconnected",
      body: "Campaigns won't send until you connect an email provider again.",
      link: "/app/integrations",
    });
    sendSuccess(res, { disconnected: true });
  }),

  connectOutlook: asyncHandler(async (req: Request, res: Response) => {
    const url = integrationService.getOutlookConsentUrl(req.userId!);
    sendSuccess(res, { url });
  }),

  /** Public redirect target from Microsoft — not behind authMiddleware, user identity comes from state. */
  outlookCallback: asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = callbackQuerySchema.parse(req.query);
    if (!state) throw new ValidationError("Missing state");
    const { email } = await integrationService.handleOutlookCallback(state, code);
    // `state` is the authenticated userId, threaded through Microsoft's redirect.
    await auditService.record(req, {
      action: "integration.connected",
      entityType: "integration",
      metadata: { provider: "outlook", email },
      userId: state,
    });
    res.redirect(`${env.APP_BASE_URL}/settings/integrations?outlook=connected`);
  }),

  disconnectOutlook: asyncHandler(async (req: Request, res: Response) => {
    await integrationService.disconnectOutlook(req.userId!);
    await auditService.record(req, {
      action: "integration.disconnected",
      entityType: "integration",
      metadata: { provider: "outlook" },
    });
    await notificationService.create(req.userId!, {
      type: "integration.disconnected",
      title: "Outlook disconnected",
      body: "Campaigns won't send until you connect an email provider again.",
      link: "/app/integrations",
    });
    sendSuccess(res, { disconnected: true });
  }),
};
