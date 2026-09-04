/**
 * Reusable email template with {{variable}} placeholders.
 */
export interface CreateTemplateInput {
  name: string;
  subject: string;
  body: string;
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;

export interface TemplatePreviewInput {
  subject: string;
  body: string;
  values: TemplateVariableValues;
}

export interface TemplatePreviewResult {
  subject: string;
  body: string;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Variables interpolated into template subject/body. Kept as a single source
 * of truth so the AI writer, template preview, and campaign send path never
 * diverge on placeholder names.
 */
export const TEMPLATE_VARIABLES = [
  "firstName",
  "lastName",
  "company",
  "jobTitle",
  "senderName",
  "senderCompany",
  "linkedin",
  "github",
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export type TemplateVariableValues = Partial<Record<TemplateVariable, string>>;

/** Which variables are about the recipient (a Contact field) vs the sender
 * (the logged-in User's own profile) — drives the "Insert variable" picker's
 * grouping so the two are never confused for each other. */
export const CONTACT_TEMPLATE_VARIABLES: TemplateVariable[] = ["firstName", "lastName", "company", "jobTitle"];
export const SENDER_TEMPLATE_VARIABLES: TemplateVariable[] = ["senderName", "senderCompany", "linkedin", "github"];

/** Human-readable label for each variable, used by the "Insert variable" picker. */
export const TEMPLATE_VARIABLE_LABELS: Record<TemplateVariable, string> = {
  firstName: "First name",
  lastName: "Last name",
  company: "Company",
  jobTitle: "Job title",
  senderName: "Your name",
  senderCompany: "Your company",
  linkedin: "Your LinkedIn (as a link)",
  github: "Your GitHub (as a link)",
};
