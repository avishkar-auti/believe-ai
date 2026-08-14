import { Router } from "express";
import { auditController } from "../controllers/audit.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const auditRouter = Router();

auditRouter.use(authMiddleware);
auditRouter.get("/", auditController.list);
