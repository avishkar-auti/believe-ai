import { Router } from "express";
import { jobLeadController } from "../controllers/jobLead.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const jobLeadRouter = Router();

jobLeadRouter.use(authMiddleware);

jobLeadRouter.post("/", jobLeadController.discover);
jobLeadRouter.get("/by-job/:jobIntelId", jobLeadController.listByJobIntel);
jobLeadRouter.post("/:id/add-to-contacts", jobLeadController.addToContacts);
