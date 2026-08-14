import { Router } from "express";
import { userContextController } from "../controllers/userContext.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const userContextRouter = Router();

userContextRouter.use(authMiddleware);
userContextRouter.get("/", userContextController.get);
userContextRouter.put("/", userContextController.update);
