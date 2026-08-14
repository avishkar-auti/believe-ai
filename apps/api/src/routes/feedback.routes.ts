import { Router } from "express";
import { feedbackController } from "../controllers/feedback.controller.js";
import { optionalAuth } from "../middleware/optionalAuth.middleware.js";

export const feedbackRouter = Router();

feedbackRouter.post("/", optionalAuth, feedbackController.submit);
