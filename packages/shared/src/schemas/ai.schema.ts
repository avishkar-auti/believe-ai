import { z } from "zod";

export const aiEmailGenerationRequestSchema = z.object({
  goal: z.string().min(1),
  target: z.string().min(1),
  tone: z.string().min(1),
  context: z.string().optional(),
});

export const aiEmailGenerationResultSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
});

export const AI_IMPROVE_ACTIONS = [
  "make_shorter",
  "make_professional",
  "make_friendly",
  "make_persuasive",
  "make_concise",
  "fix_grammar",
  "rewrite",
] as const;

export const aiImproveRequestSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  action: z.enum(AI_IMPROVE_ACTIONS),
});

export const aiPersonalizeRequestSchema = z.object({
  templateSubject: z.string().min(1),
  templateBody: z.string().min(1),
  contact: z.object({
    firstName: z.string(),
    lastName: z.string(),
    company: z.string().nullable(),
    jobTitle: z.string().nullable(),
  }),
  senderContext: z.string().optional(),
});

export const aiPersonalizeResultSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const aiCampaignInsightResultSchema = z.object({
  summary: z.string().min(1),
  whatWorked: z.array(z.string()),
  whatToImprove: z.array(z.string()),
});
