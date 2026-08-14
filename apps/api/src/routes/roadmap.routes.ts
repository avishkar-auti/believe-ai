import { Router } from "express";
import { roadmapController } from "../controllers/roadmap.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const roadmapRouter = Router();

roadmapRouter.use(authMiddleware);

roadmapRouter.get("/", roadmapController.list);
roadmapRouter.post("/", roadmapController.generate);
roadmapRouter.get("/:id", roadmapController.get);
roadmapRouter.delete("/:id", roadmapController.remove);
