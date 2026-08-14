import { z } from "zod";

/**
 * Zod schema mirroring the User type. Used to validate create/update payloads.
 */
export const userSchema = z.object({
  id: z.string(),
  firebaseUid: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().nullable(),
  company: z.string().nullable(),
  jobTitle: z.string().nullable(),
  timezone: z.string().min(1),
  role: z.enum(["user", "admin"]),
  onboardingCompleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
