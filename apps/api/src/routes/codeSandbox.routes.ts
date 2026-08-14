import { Router } from "express";
import { codeSandboxController } from "../controllers/codeSandbox.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const codeSandboxRouter = Router();

codeSandboxRouter.use(authMiddleware);

codeSandboxRouter.post("/run", codeSandboxController.run);
