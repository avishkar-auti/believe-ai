import { Router } from "express";
import { integrationController } from "../controllers/integration.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const integrationRouter = Router();

integrationRouter.get("/", authMiddleware, integrationController.list);

integrationRouter.post("/gmail/connect", authMiddleware, integrationController.connectGmail);
integrationRouter.delete("/gmail", authMiddleware, integrationController.disconnectGmail);
// Google redirects the browser here directly, so this route intentionally has no authMiddleware.
integrationRouter.get("/gmail/callback", integrationController.gmailCallback);

integrationRouter.post("/outlook/connect", authMiddleware, integrationController.connectOutlook);
integrationRouter.delete("/outlook", authMiddleware, integrationController.disconnectOutlook);
// Microsoft redirects the browser here directly, so this route intentionally has no authMiddleware.
integrationRouter.get("/outlook/callback", integrationController.outlookCallback);
