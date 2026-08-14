import type { FilterQuery, SortOrder } from "mongoose";
import { ContactModel, type ContactDocument } from "@believe-ai/server";

export interface ContactListQuery {
  userId: string;
  search?: string;
  tags?: string[];
  subscribed?: boolean;
  sortBy?: "createdAt" | "firstName" | "email" | "company";
  sortDir?: "asc" | "desc";
  page: number;
  limit: number;
}

export interface CreateContactRecord {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  jobTitle: string | null;
  phone: string | null;
  tags: string[];
  notes: string | null;
  source: "manual" | "csv_import" | "api";
  subscribed: boolean;
}

export const contactRepository = {
  async list(query: ContactListQuery) {
    const filter: FilterQuery<ContactDocument> = { userId: query.userId };

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), "i");
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { company: regex }];
    }
    if (query.tags?.length) {
      filter.tags = { $in: query.tags };
    }
    if (typeof query.subscribed === "boolean") {
      filter.subscribed = query.subscribed;
    }

    const sort: Record<string, SortOrder> = {
      [query.sortBy ?? "createdAt"]: query.sortDir === "asc" ? 1 : -1,
    };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      ContactModel.find(filter).sort(sort).skip(skip).limit(query.limit),
      ContactModel.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id: string, userId: string) {
    return ContactModel.findOne({ _id: id, userId });
  },

  findByEmail(userId: string, email: string) {
    return ContactModel.findOne({ userId, email: email.toLowerCase() });
  },

  async findExistingEmails(userId: string, emails: string[]): Promise<Set<string>> {
    const existing = await ContactModel.find({ userId, email: { $in: emails } })
      .select("email")
      .lean();
    return new Set(existing.map((c) => c.email));
  },

  create(data: CreateContactRecord) {
    return ContactModel.create(data);
  },

  bulkInsert(records: CreateContactRecord[]) {
    return ContactModel.insertMany(records, { ordered: false });
  },

  update(id: string, userId: string, updates: Partial<CreateContactRecord>) {
    return ContactModel.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
  },

  delete(id: string, userId: string) {
    return ContactModel.findOneAndDelete({ _id: id, userId });
  },

  findManyByIds(ids: string[], userId: string) {
    return ContactModel.find({ _id: { $in: ids }, userId });
  },

  countByUserId(userId: string) {
    return ContactModel.countDocuments({ userId });
  },
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
