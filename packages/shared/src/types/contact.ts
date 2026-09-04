/**
 * Canonical Contact type shared between the API and the web client.
 */
export type ContactSource = "manual" | "csv_import" | "api";
// "linkedin" = added from a discovered job lead for the LinkedIn message
// only — email is a generated placeholder, never a real address.
export type ContactOutreachChannel = "email" | "linkedin";

export interface Contact {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  jobTitle: string | null;
  phone: string | null;
  tags: string[];
  notes: string | null;
  source: ContactSource;
  subscribed: boolean;
  outreachChannel: ContactOutreachChannel;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  firstName: string;
  lastName?: string;
  email: string;
  company?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  tags?: string[];
  notes?: string | null;
}

export interface CsvColumnMapping {
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
}

export interface CsvImportRowError {
  row: number;
  reason: "invalid_email" | "duplicate_email" | "missing_email" | "unsubscribed";
  raw: Record<string, string>;
}

export interface CsvImportSummary {
  imported: number;
  duplicatesSkipped: number;
  invalidSkipped: number;
  unsubscribedSkipped: number;
  errors: CsvImportRowError[];
}
