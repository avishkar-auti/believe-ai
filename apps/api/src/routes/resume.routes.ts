import { Router } from "express";
import multer from "multer";
import { resumeController } from "../controllers/resume.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });

export const resumeRouter = Router();

resumeRouter.use(authMiddleware);

resumeRouter.get("/", resumeController.get);
resumeRouter.post("/", upload.single("file"), resumeController.upload);
resumeRouter.delete("/", resumeController.remove);
