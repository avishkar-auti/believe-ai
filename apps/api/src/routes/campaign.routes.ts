import { Router } from "express";
import { campaignController } from "../controllers/campaign.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const campaignRouter = Router();

campaignRouter.use(authMiddleware);

campaignRouter.get("/", campaignController.list);
campaignRouter.post("/", campaignController.create);
campaignRouter.get("/:id", campaignController.get);
campaignRouter.patch("/:id", campaignController.update);
campaignRouter.post("/:id/launch", campaignController.launch);
campaignRouter.post("/:id/pause", campaignController.pause);
campaignRouter.post("/:id/resume", campaignController.resume);
campaignRouter.post("/:id/cancel", campaignController.cancel);
campaignRouter.get("/:id/analytics", campaignController.analytics);
campaignRouter.get("/:id/recipients", campaignController.recipients);
campaignRouter.post("/:id/recipients/:contactId/mark-replied", campaignController.markReplied);
// AI campaign insights now live entirely in the Python AI service (GET /campaigns/:id/insights there).
