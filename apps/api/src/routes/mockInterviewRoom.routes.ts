import { Router } from "express";
import { mockInterviewRoomController } from "../controllers/mockInterviewRoom.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const mockInterviewRoomRouter = Router();

mockInterviewRoomRouter.use(authMiddleware);

mockInterviewRoomRouter.get("/mine", mockInterviewRoomController.listMine);
mockInterviewRoomRouter.get("/ice-servers", mockInterviewRoomController.iceServers);
mockInterviewRoomRouter.post("/", mockInterviewRoomController.schedule);
mockInterviewRoomRouter.get("/:code", mockInterviewRoomController.getByCode);
mockInterviewRoomRouter.delete("/:id", mockInterviewRoomController.cancel);
