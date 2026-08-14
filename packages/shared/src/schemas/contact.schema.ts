import { z } from "zod";

export const contactSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string(),
  email: z.string().email(),
  company: z.string().nullable(),
  jobTitle: z.string().nullable(),
  phone: z.string().nullable(),
  tags: z.array(z.string()),
  notes: z.string().nullable(),
  source: z.enum(["manual", "csv_import", "api"]),
  subscribed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().default(""),
  email: z.string().email(),
  company: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const csvColumnMappingSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().min(1),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
});

export const csvImportRequestSchema = z.object({
  rows: z.array(z.record(z.string(), z.string())),
  mapping: csvColumnMappingSchema,
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CsvImportRequestInput = z.infer<typeof csvImportRequestSchema>;
