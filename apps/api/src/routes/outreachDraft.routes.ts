import { Router } from "express";
import { outreachDraftController } from "../controllers/outreachDraft.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const outreachDraftRouter = Router();

outreachDraftRouter.use(authMiddleware);

outreachDraftRouter.post("/", outreachDraftController.generate);
outreachDraftRouter.get("/by-job/:jobIntelId", outreachDraftController.listByJobIntel);
outreachDraftRouter.patch("/:id", outreachDraftController.decide);
outreachDraftRouter.post("/:id/send", outreachDraftController.send);
outreachDraftRouter.get("/:id/send-logs", outreachDraftController.listSendLogs);
outreachDraftRouter.get("/:id/follow-ups", outreachDraftController.listFollowUps);
outreachDraftRouter.post("/:id/mark-replied", outreachDraftController.markReplied);
