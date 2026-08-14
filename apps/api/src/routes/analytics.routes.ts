import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware);
analyticsRouter.get("/dashboard", analyticsController.dashboard);
analyticsRouter.get("/emails", analyticsController.emails);
analyticsRouter.get("/campaigns/:id", analyticsController.campaign);
