import { Router } from "express";
import { careerFitController } from "../controllers/careerFit.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const careerFitRouter = Router();

careerFitRouter.use(authMiddleware);

careerFitRouter.get("/", careerFitController.list);
careerFitRouter.post("/", careerFitController.generate);
careerFitRouter.get("/:id", careerFitController.get);
careerFitRouter.delete("/:id", careerFitController.remove);
