import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.get("/me", authMiddleware, authController.me);
authRouter.patch("/me", authMiddleware, authController.updateMe);
