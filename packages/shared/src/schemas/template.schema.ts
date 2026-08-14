import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
