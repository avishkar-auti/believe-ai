import { z } from "zod";

export const createFeedbackSchema = z.object({
  message: z.string().min(1).max(2000),
  page: z.string().max(500).nullable().optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
