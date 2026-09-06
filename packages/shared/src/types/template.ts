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
 * The merge-variable registry — mirrored by apps/backend/services/personalization.py,
 * which is the authority at send time. This copy exists so the composer can
 * render the picker and detect unresolved variables without a round trip; if
 * you add a variable, add it in both.
 *
 * Recipient variables resolve per contact. Sender variables resolve from the
 * signed-in user's Profile, and only ever on the server — a stored template
 * keeps the raw {{token}}, so editing your profile updates every template,
 * preview and scheduled follow-up at once with nothing to migrate.
 */
export interface TemplateVariableSpec {
  key: TemplateVariable;
  label: string;
  group: "recipient" | "sender";
  description: string;
}

export const TEMPLATE_VARIABLE_SPECS = [
  { key: "firstName", label: "First name", group: "recipient", description: "Recipient's first name." },
  { key: "lastName", label: "Last name", group: "recipient", description: "Recipient's last name." },
  { key: "fullName", label: "Full name", group: "recipient", description: "Recipient's full name." },
  { key: "company", label: "Company", group: "recipient", description: "Recipient's company." },
  { key: "jobTitle", label: "Job title", group: "recipient", description: "The role you're writing about." },
  { key: "recipientEmail", label: "Recipient email", group: "recipient", description: "Recipient's email address." },
  { key: "senderName", label: "Your name", group: "sender", description: "From your profile name." },
  { key: "senderFirstName", label: "Your first name", group: "sender", description: "From your profile name." },
  { key: "senderLastName", label: "Your last name", group: "sender", description: "From your profile name." },
  { key: "senderTitle", label: "Your title", group: "sender", description: "From your profile job title or headline." },
  { key: "senderEmail", label: "Your email", group: "sender", description: "From your account email." },
  { key: "senderCompany", label: "Your company", group: "sender", description: "From your profile company." },
  { key: "phone", label: "Your phone", group: "sender", description: "From your profile phone number." },
  { key: "linkedin", label: "LinkedIn", group: "sender", description: "A linked “LinkedIn” from your profile." },
  { key: "github", label: "GitHub", group: "sender", description: "A linked “GitHub” from your profile." },
  { key: "portfolio", label: "Portfolio", group: "sender", description: "A linked “Portfolio” from your profile." },
  { key: "linkedinUrl", label: "LinkedIn URL", group: "sender", description: "The raw LinkedIn URL as text." },
  { key: "githubUrl", label: "GitHub URL", group: "sender", description: "The raw GitHub URL as text." },
  { key: "portfolioUrl", label: "Portfolio URL", group: "sender", description: "The raw portfolio URL as text." },
] as const satisfies readonly { key: string; label: string; group: "recipient" | "sender"; description: string }[];

export const TEMPLATE_VARIABLES = TEMPLATE_VARIABLE_SPECS.map((v) => v.key);

export type TemplateVariable = (typeof TEMPLATE_VARIABLE_SPECS)[number]["key"];

export type TemplateVariableValues = Partial<Record<TemplateVariable, string>>;

/** Names an older template may already contain, folded onto the canonical key
 * at render time. Aliasing rather than rewriting stored bodies means no
 * migration can corrupt someone's template. */
export const TEMPLATE_VARIABLE_ALIASES: Record<string, TemplateVariable> = {
  first_name: "firstName",
  last_name: "lastName",
  full_name: "fullName",
  job_title: "jobTitle",
  recipient_email: "recipientEmail",
  sender_name: "senderName",
  sender_first_name: "senderFirstName",
  sender_last_name: "senderLastName",
  sender_title: "senderTitle",
  sender_email: "senderEmail",
  sender_company: "senderCompany",
  linkedin_url: "linkedinUrl",
  github_url: "githubUrl",
  portfolio_url: "portfolioUrl",
};

export function canonicalTemplateVariable(name: string): string {
  return TEMPLATE_VARIABLE_ALIASES[name] ?? name;
}

/** Which variables are about the recipient (a Contact field) vs the sender
 * (the logged-in User's own profile) — drives the "Insert variable" picker's
 * grouping so the two are never confused for each other. */
export const CONTACT_TEMPLATE_VARIABLES: TemplateVariable[] = TEMPLATE_VARIABLE_SPECS.filter((v) => v.group === "recipient").map((v) => v.key);
export const SENDER_TEMPLATE_VARIABLES: TemplateVariable[] = TEMPLATE_VARIABLE_SPECS.filter((v) => v.group === "sender").map((v) => v.key);

/** Human-readable label for each variable, used by the "Insert variable" picker. */
export const TEMPLATE_VARIABLE_LABELS = Object.fromEntries(TEMPLATE_VARIABLE_SPECS.map((v) => [v.key, v.label])) as Record<
  TemplateVariable,
  string
>;

/** Server-resolved state of one variable for the signed-in user — what the
 * variable picker shows instead of guessing. See GET /templates/variables. */
export interface PersonalizationVariable {
  key: string;
  /** The literal text to insert, e.g. "{{senderName}}". Built server-side so
   * brace/spacing conventions can't drift between client and server. */
  token: string;
  label: string;
  group: "recipient" | "sender";
  description: string;
  required: boolean;
  /** Sender variables: whether the profile actually has this filled in.
   * Recipient variables are always true — they resolve per contact. */
  configured: boolean;
  /** What a sender variable currently resolves to, for the picker's preview
   * line; null when nothing is set. Link variables show their URL, not markup. */
  currentValue: string | null;
}

export interface PersonalizationContext {
  variables: PersonalizationVariable[];
  /** Every sender variable the profile can't currently fill. Intersect with
   * what a template actually uses before warning about it. */
  missingSenderKeys: string[];
}
