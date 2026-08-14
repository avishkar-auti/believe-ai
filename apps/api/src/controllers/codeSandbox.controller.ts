import type { Request, Response } from "express";
import { z } from "zod";
import { codeSandboxService } from "../services/codeSandbox.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const runSchema = z.object({
  language: z.string().min(1),
  sourceCode: z.string().min(1),
  stdin: z.string().optional(),
});

export const codeSandboxController = {
  run: asyncHandler(async (req: Request, res: Response) => {
    const input = runSchema.parse(req.body);
    const result = await codeSandboxService.run(input.language, input.sourceCode, input.stdin ?? "");
    sendSuccess(res, result);
  }),
};
