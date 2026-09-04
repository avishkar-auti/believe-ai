import type { Contact, TemplateVariableValues, User } from "@believe-ai/shared";

/** Real values only — a field that's genuinely empty on the contact or
 * user's profile is simply omitted, so the preview honestly shows it as
 * missing rather than substituting an empty string that looks resolved. */
export function buildVariableValues(recipient: Contact | undefined, sender: User | undefined): TemplateVariableValues {
  const values: TemplateVariableValues = {};
  if (recipient) {
    if (recipient.firstName) values.firstName = recipient.firstName;
    if (recipient.lastName) values.lastName = recipient.lastName;
    if (recipient.company) values.company = recipient.company;
    if (recipient.jobTitle) values.jobTitle = recipient.jobTitle;
  }
  if (sender) {
    if (sender.name) values.senderName = sender.name;
    if (sender.company) values.senderCompany = sender.company;
    if (sender.socialLinks?.linkedin) values.linkedin = sender.socialLinks.linkedin;
    if (sender.socialLinks?.github) values.github = sender.socialLinks.github;
  }
  return values;
}

const VARIABLE_PATTERN = /{{\s*(\w+)\s*}}/g;

/** Mirrors the backend's own {{name}} regex (template_service.py) so "missing"
 * here means the same thing it would mean when this email actually sends. */
export function findMissingVariables(subject: string, body: string, values: TemplateVariableValues): string[] {
  const found = new Set<string>();
  for (const text of [subject, body]) {
    for (const match of text.matchAll(VARIABLE_PATTERN)) {
      const name = match[1]!;
      if (!values[name as keyof TemplateVariableValues]) found.add(name);
    }
  }
  return [...found];
}
