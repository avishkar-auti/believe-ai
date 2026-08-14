import { Router } from "express";
import { templateController } from "../controllers/template.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const templateRouter = Router();

templateRouter.use(authMiddleware);

templateRouter.get("/", templateController.list);
templateRouter.post("/", templateController.create);
templateRouter.post("/preview", templateController.preview);
templateRouter.get("/:id", templateController.get);
templateRouter.patch("/:id", templateController.update);
templateRouter.delete("/:id", templateController.remove);
templateRouter.post("/:id/duplicate", templateController.duplicate);
