import { z } from "zod";

export const updateUserContextSchema = z.object({
  aboutMe: z.string().max(2000).nullable().optional(),
  companyInfo: z.string().max(2000).nullable().optional(),
  servicesOrProducts: z.string().max(2000).nullable().optional(),
  skillsAndExperience: z.string().max(2000).nullable().optional(),
  achievements: z.string().max(2000).nullable().optional(),
  targetAudience: z.string().max(2000).nullable().optional(),
});

export type UpdateUserContextInput = z.infer<typeof updateUserContextSchema>;
