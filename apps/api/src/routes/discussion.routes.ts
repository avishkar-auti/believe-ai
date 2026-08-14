import { Router } from "express";
import { discussionController } from "../controllers/discussion.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const discussionRouter = Router();

discussionRouter.use(authMiddleware);

discussionRouter.get("/", discussionController.list);
discussionRouter.post("/", discussionController.create);
discussionRouter.get("/:id", discussionController.get);
discussionRouter.post("/:id/replies", discussionController.addReply);
discussionRouter.post("/:id/upvote", discussionController.toggleUpvote);
discussionRouter.delete("/:id", discussionController.remove);
