import { z } from "zod";

export const campaignFollowUpSchema = z.object({
  templateId: z.string().min(1),
  delayDays: z.number().int().positive().max(90),
  subjectOverride: z.string().nullable().optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  templateId: z.string().min(1),
  audienceContactIds: z.array(z.string()).min(1),
  scheduledAt: z.string().datetime().nullable().optional(),
  timezone: z.string().min(1).default("UTC"),
  dailyLimit: z.number().int().positive().max(2000).default(200),
  personalizationEnabled: z.boolean().default(true),
  trackingEnabled: z.boolean().default(true),
  followUps: z.array(campaignFollowUpSchema).default([]),
  stopOnReply: z.boolean().default(true),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
