import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const notificationRouter = Router();

notificationRouter.use(authMiddleware);
notificationRouter.get("/", notificationController.list);
notificationRouter.post("/read-all", notificationController.markAllRead);
notificationRouter.post("/:id/read", notificationController.markRead);
