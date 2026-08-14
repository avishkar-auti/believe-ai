import { Router } from "express";
import mongoose from "mongoose";
import { sendSuccess } from "../utils/apiResponse.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  sendSuccess(res, {
    status: "ok",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});
