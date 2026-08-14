import type { HydratedDocument } from "mongoose";
import { z } from "zod";
import type {
  Contact,
  CreateContactInput,
  CsvColumnMapping,
  CsvImportRowError,
  CsvImportSummary,
  PaginatedResult,
  UpdateContactInput,
} from "@believe-ai/shared";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@believe-ai/shared";
import type { ContactDocument } from "@believe-ai/server";
import { contactRepository, type ContactListQuery } from "../repositories/contact.repository.js";
import { unsubscribeRepository } from "../repositories/unsubscribe.repository.js";
import { usageService } from "./usage.service.js";
import { NotFoundError } from "../errors/AppError.js";

const emailSchema = z.string().email();

function toDto(doc: HydratedDocument<ContactDocument>): Contact {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    firstName: doc.firstName,
    lastName: doc.lastName ?? "",
    email: doc.email,
    company: doc.company ?? null,
    jobTitle: doc.jobTitle ?? null,
    phone: doc.phone ?? null,
    tags: doc.tags ?? [],
    notes: doc.notes ?? null,
    source: doc.source as Contact["source"],
    subscribed: doc.subscribed,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const contactService = {
  toDto,

  async list(
    userId: string,
    params: {
      search?: string;
      tags?: string[];
      subscribed?: boolean;
      sortBy?: ContactListQuery["sortBy"];
      sortDir?: ContactListQuery["sortDir"];
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResult<Contact>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, params.limit ?? DEFAULT_PAGE_SIZE));

    const { items, total } = await contactRepository.list({
      userId,
      search: params.search,
      tags: params.tags,
      subscribed: params.subscribed,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      page,
      limit,
    });

    return {
      items: items.map(toDto),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async getById(id: string, userId: string): Promise<Contact> {
    const contact = await contactRepository.findById(id, userId);
    if (!contact) throw new NotFoundError("Contact not found");
    return toDto(contact);
  },

  async create(userId: string, input: CreateContactInput): Promise<Contact> {
    await usageService.assertCanAddContacts(userId, 1);
    const contact = await contactRepository.create({
      userId,
      firstName: input.firstName,
      lastName: input.lastName ?? "",
      email: input.email.toLowerCase(),
      company: input.company ?? null,
      jobTitle: input.jobTitle ?? null,
      phone: input.phone ?? null,
      tags: input.tags ?? [],
      notes: input.notes ?? null,
      source: "manual",
      subscribed: true,
    });
    return toDto(contact);
  },

  async update(id: string, userId: string, input: UpdateContactInput): Promise<Contact> {
    const updates = { ...input, email: input.email?.toLowerCase() };
    const contact = await contactRepository.update(id, userId, updates);
    if (!contact) throw new NotFoundError("Contact not found");
    return toDto(contact);
  },

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await contactRepository.delete(id, userId);
    if (!deleted) throw new NotFoundError("Contact not found");
  },

  /**
   * Validates and inserts a CSV batch. Each row is checked independently so
   * one bad row never aborts the whole import; the summary reports exactly
   * what happened to every row (spec 5.5).
   */
  async importCsv(
    userId: string,
    rows: Record<string, string>[],
    mapping: CsvColumnMapping,
  ): Promise<CsvImportSummary> {
    const errors: CsvImportRowError[] = [];
    const validRows: { email: string; record: Omit<CreateContactInput, "email"> & { email: string } }[] = [];
    const seenInBatch = new Set<string>();

    rows.forEach((raw, index) => {
      const email = raw[mapping.email]?.trim().toLowerCase();
      if (!email) {
        errors.push({ row: index, reason: "missing_email", raw });
        return;
      }
      if (!emailSchema.safeParse(email).success) {
        errors.push({ row: index, reason: "invalid_email", raw });
        return;
      }
      if (seenInBatch.has(email)) {
        errors.push({ row: index, reason: "duplicate_email", raw });
        return;
      }
      seenInBatch.add(email);
      validRows.push({
        email,
        record: {
          firstName: mapping.firstName ? (raw[mapping.firstName] ?? "") : "",
          lastName: mapping.lastName ? (raw[mapping.lastName] ?? "") : "",
          email,
          company: mapping.company ? (raw[mapping.company] ?? null) : null,
          jobTitle: mapping.jobTitle ? (raw[mapping.jobTitle] ?? null) : null,
          phone: mapping.phone ? (raw[mapping.phone] ?? null) : null,
          tags: [],
        },
      });
    });

    const emails = validRows.map((r) => r.email);
    const [existingEmails, unsubscribedEmails] = await Promise.all([
      contactRepository.findExistingEmails(userId, emails),
      unsubscribeRepository.findUnsubscribedEmails(userId, emails),
    ]);

    const toInsert: Parameters<typeof contactRepository.bulkInsert>[0] = [];
    let duplicatesSkipped = 0;
    let unsubscribedSkipped = 0;

    for (const [index, row] of validRows.entries()) {
      if (existingEmails.has(row.email)) {
        duplicatesSkipped += 1;
        errors.push({ row: index, reason: "duplicate_email", raw: rows[index] ?? {} });
        continue;
      }
      if (unsubscribedEmails.has(row.email)) {
        unsubscribedSkipped += 1;
        errors.push({ row: index, reason: "unsubscribed", raw: rows[index] ?? {} });
        continue;
      }
      toInsert.push({
        userId,
        firstName: row.record.firstName || row.email.split("@")[0] || "",
        lastName: row.record.lastName ?? "",
        email: row.email,
        company: row.record.company ?? null,
        jobTitle: row.record.jobTitle ?? null,
        phone: row.record.phone ?? null,
        tags: [],
        notes: null,
        source: "csv_import",
        subscribed: true,
      });
    }

    if (toInsert.length > 0) {
      // Checked against what will actually be inserted, after duplicates and
      // unsubscribes are filtered out — importing a 1000-row file that's
      // mostly duplicates shouldn't be rejected for the rows it skips.
      await usageService.assertCanAddContacts(userId, toInsert.length);
      await contactRepository.bulkInsert(toInsert);
    }

    const invalidSkipped = errors.filter(
      (e) => e.reason === "invalid_email" || e.reason === "missing_email",
    ).length;

    return {
      imported: toInsert.length,
      duplicatesSkipped,
      invalidSkipped,
      unsubscribedSkipped,
      errors,
    };
  },

  async exportAll(userId: string): Promise<Contact[]> {
    const { items } = await contactRepository.list({ userId, page: 1, limit: 100000 });
    return items.map(toDto);
  },
};
