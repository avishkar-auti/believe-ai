/**
 * Reusable email template with {{variable}} placeholders.
 */
// "text" (default) is the legacy/plain format, normalized into real HTML
// (paragraphs, lists, bold, links) at render time. "html" is real HTML
// authored through the Write/HTML composer (EmailBodyEditor) — every
// template saved through the editor is this format; every template that
// predates it reads back as "text" with no migration needed.
export type TemplateBodyFormat = "text" | "html";

export interface CreateTemplateInput {
  name: string;
  subject: string;
  body: string;
  bodyFormat?: TemplateBodyFormat;
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;

export interface TemplatePreviewInput {
  subject: string;
  body: string;
  bodyFormat?: TemplateBodyFormat;
  values: TemplateVariableValues;
}

export interface TemplatePreviewResult {
  subject: string;
  /** Always real, rendered HTML — safe to render directly regardless of
   * the source template's bodyFormat. */
  body: string;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  bodyFormat: TemplateBodyFormat;
  /** Always-rendered representations of `body` — see TemplatePreviewResult. */
  bodyHtml: string;
  bodyText: string;
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
