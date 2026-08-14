/**
 * Reusable email template with {{variable}} placeholders.
 */
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
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export type TemplateVariableValues = Partial<Record<TemplateVariable, string>>;
