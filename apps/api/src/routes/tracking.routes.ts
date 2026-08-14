import { Router } from "express";
import { trackingController } from "../controllers/tracking.controller.js";

// Public routes — hit directly by email clients and browsers, no auth.
export const trackingRouter = Router();

trackingRouter.get("/open/:token", trackingController.open);
trackingRouter.get("/click/:token", trackingController.click);
trackingRouter.get("/unsubscribe/:token", trackingController.unsubscribe);
