import { Router } from "express";
import multer from "multer";
import { contactController } from "../controllers/contact.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const contactRouter = Router();

contactRouter.use(authMiddleware);

contactRouter.get("/", contactController.list);
contactRouter.post("/", contactController.create);
contactRouter.get("/export", contactController.exportCsv);
contactRouter.post("/import/parse", upload.single("file"), contactController.parseCsv);
contactRouter.post("/import", contactController.importCsv);
contactRouter.get("/:id", contactController.get);
contactRouter.patch("/:id", contactController.update);
contactRouter.delete("/:id", contactController.remove);
