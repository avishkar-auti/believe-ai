import { z } from "zod";

export const createJobSchema = z
  .object({
    title: z.string().min(1),
    company: z.string().min(1),
    location: z.string().nullable().optional(),
    description: z.string().min(1),
    skills: z.array(z.string()).default([]),
    employmentType: z.enum(["full_time", "part_time", "contract", "internship"]).nullable().optional(),
    workMode: z.enum(["remote", "hybrid", "onsite"]).nullable().optional(),
    experienceLevel: z.enum(["fresher", "junior", "mid", "senior", "lead"]).nullable().optional(),
    salaryMin: z.number().nonnegative().nullable().optional(),
    salaryMax: z.number().nonnegative().nullable().optional(),
    recruiterLinkedIn: z.string().url().nullable().optional(),
    applyUrl: z.string().url().nullable().optional(),
  })
  .refine((v) => v.salaryMin == null || v.salaryMax == null || v.salaryMax >= v.salaryMin, {
    message: "Maximum salary must be at or above the minimum.",
    path: ["salaryMax"],
  });

export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  location: z.string().nullable().optional(),
  description: z.string().min(1).optional(),
  skills: z.array(z.string()).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"]).nullable().optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]).nullable().optional(),
  experienceLevel: z.enum(["fresher", "junior", "mid", "senior", "lead"]).nullable().optional(),
  salaryMin: z.number().nonnegative().nullable().optional(),
  salaryMax: z.number().nonnegative().nullable().optional(),
  recruiterLinkedIn: z.string().url().nullable().optional(),
  applyUrl: z.string().url().nullable().optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
