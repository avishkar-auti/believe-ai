import type { Request, Response } from "express";
import { z } from "zod";
import { leadDiscoveryService } from "../services/leadDiscovery.service.js";
import { auditService } from "../services/audit.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const discoverSchema = z.object({
  jobIntelId: z.string().trim().min(1),
});

const addToContactsSchema = z.object({
  email: z.string().trim().email(),
});

export const jobLeadController = {
  discover: asyncHandler(async (req: Request, res: Response) => {
    const input = discoverSchema.parse(req.body);
    const result = await leadDiscoveryService.discover(req.userId!, input.jobIntelId);
    await auditService.record(req, { action: "job_lead.discovered", entityType: "job_lead", entityId: input.jobIntelId });
    sendSuccess(res, result, 201);
  }),

  listByJobIntel: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await leadDiscoveryService.listByJobIntel(req.params.jobIntelId!, req.userId!));
  }),

  addToContacts: asyncHandler(async (req: Request, res: Response) => {
    const input = addToContactsSchema.parse(req.body);
    const result = await leadDiscoveryService.addToContacts(req.params.id!, req.userId!, input.email.toLowerCase());
    await auditService.record(req, { action: "job_lead.added_to_contact", entityType: "job_lead", entityId: result.id });
    sendSuccess(res, result);
  }),
};
