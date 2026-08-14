import { Router } from "express";
import { jobController } from "../controllers/job.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRecruiter } from "../middleware/requireRecruiter.middleware.js";

export const jobRouter = Router();

jobRouter.use(authMiddleware);

// Browsing the board is open to every signed-in user — only posting/managing needs recruiter mode.
jobRouter.get("/", jobController.search);
jobRouter.get("/filters", jobController.filters);
jobRouter.get("/mine", requireRecruiter, jobController.listMine);
jobRouter.get("/:id", jobController.get);
jobRouter.post("/", requireRecruiter, jobController.create);
jobRouter.post("/:id/save", jobController.toggleSave);
jobRouter.patch("/:id", requireRecruiter, jobController.update);
jobRouter.delete("/:id", requireRecruiter, jobController.remove);
