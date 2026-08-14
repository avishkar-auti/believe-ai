import type { Request, Response } from "express";
import Papa from "papaparse";
import {
  createContactSchema,
  csvImportRequestSchema,
  updateContactSchema,
} from "@believe-ai/shared";
import { z } from "zod";
import { contactService } from "../services/contact.service.js";
import { auditService } from "../services/audit.service.js";
import { notificationService } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ValidationError } from "../errors/AppError.js";

const listQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.string().optional(),
  subscribed: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["createdAt", "firstName", "email", "company"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const contactController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const q = listQuerySchema.parse(req.query);
    const result = await contactService.list(req.userId!, {
      search: q.search,
      tags: q.tags ? q.tags.split(",").filter(Boolean) : undefined,
      subscribed: q.subscribed ? q.subscribed === "true" : undefined,
      sortBy: q.sortBy,
      sortDir: q.sortDir,
      page: q.page,
      limit: q.limit,
    });
    sendSuccess(res, result);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const contact = await contactService.getById(req.params.id!, req.userId!);
    sendSuccess(res, contact);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createContactSchema.parse(req.body);
    const contact = await contactService.create(req.userId!, input);
    sendSuccess(res, contact, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updateContactSchema.parse(req.body);
    const contact = await contactService.update(req.params.id!, req.userId!, input);
    sendSuccess(res, contact);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await contactService.delete(req.params.id!, req.userId!);
    sendSuccess(res, { deleted: true });
  }),

  /** Step 1-2 of CSV import: parse the uploaded file and return columns + rows for mapping. */
  parseCsv: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError("CSV file is required (field name: file)");
    const text = req.file.buffer.toString("utf-8");
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) {
      throw new ValidationError(`Failed to parse CSV: ${parsed.errors[0]?.message}`);
    }
    sendSuccess(res, { columns: parsed.meta.fields ?? [], rows: parsed.data });
  }),

  /** Step 3-5: validate mapped rows and insert. */
  importCsv: asyncHandler(async (req: Request, res: Response) => {
    const input = csvImportRequestSchema.parse(req.body);
    const summary = await contactService.importCsv(req.userId!, input.rows, input.mapping);

    await auditService.record(req, {
      action: "contacts.imported",
      entityType: "contact",
      metadata: {
        imported: summary.imported,
        duplicatesSkipped: summary.duplicatesSkipped,
        invalidSkipped: summary.invalidSkipped,
      },
    });
    await notificationService.create(req.userId!, {
      type: "contacts.imported",
      title: "Import completed",
      body: `${summary.imported} contacts imported, ${summary.duplicatesSkipped} duplicates skipped, ${summary.invalidSkipped} invalid.`,
      link: "/app/contacts",
    });

    sendSuccess(res, summary);
  }),

  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    const contacts = await contactService.exportAll(req.userId!);
    const csv = Papa.unparse(
      contacts.map((c) => ({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        company: c.company ?? "",
        jobTitle: c.jobTitle ?? "",
        phone: c.phone ?? "",
        tags: c.tags.join(";"),
        subscribed: c.subscribed,
      })),
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=contacts.csv");
    res.send(csv);
  }),
};
