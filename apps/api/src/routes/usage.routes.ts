import { Router } from "express";
import { usageController } from "../controllers/usage.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const usageRouter = Router();

usageRouter.use(authMiddleware);
usageRouter.get("/", usageController.get);
