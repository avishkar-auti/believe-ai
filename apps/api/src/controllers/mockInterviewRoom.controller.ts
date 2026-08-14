import type { Request, Response } from "express";
import { scheduleRoomSchema } from "@believe-ai/shared";
import { mockInterviewRoomService } from "../services/mockInterviewRoom.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const mockInterviewRoomController = {
  schedule: asyncHandler(async (req: Request, res: Response) => {
    const input = scheduleRoomSchema.parse(req.body);
    const room = await mockInterviewRoomService.schedule(req.userId!, req.userName!, input);
    sendSuccess(res, room, 201);
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await mockInterviewRoomService.listMine(req.userId!));
  }),

  getByCode: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await mockInterviewRoomService.getByCode(req.params.code!));
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    await mockInterviewRoomService.cancel(req.params.id!, req.userId!);
    sendSuccess(res, { cancelled: true });
  }),

  iceServers: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, { iceServers: mockInterviewRoomService.getIceServers() });
  }),
};
