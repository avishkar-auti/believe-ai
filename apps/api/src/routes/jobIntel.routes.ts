import { Router } from "express";
import { jobIntelController } from "../controllers/jobIntel.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const jobIntelRouter = Router();

jobIntelRouter.use(authMiddleware);

jobIntelRouter.get("/", jobIntelController.list);
jobIntelRouter.post("/", jobIntelController.analyze);
jobIntelRouter.get("/:id", jobIntelController.get);
jobIntelRouter.delete("/:id", jobIntelController.remove);
