import { z } from "zod";

export const scheduleRoomSchema = z.object({
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().max(180).default(30),
  guestEmail: z.string().email().nullable().optional(),
});

export type ScheduleRoomInput = z.infer<typeof scheduleRoomSchema>;
