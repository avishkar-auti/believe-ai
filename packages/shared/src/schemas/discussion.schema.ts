import { z } from "zod";

export const createDiscussionSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
});

export const createReplySchema = z.object({
  body: z.string().min(1),
});

export type CreateDiscussionInput = z.infer<typeof createDiscussionSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
