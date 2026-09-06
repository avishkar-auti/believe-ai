import type { Contact, TemplateVariableValues } from "@believe-ai/shared";

/** Recipient-side merge values for the contact being previewed.
 *
 * Sender variables are deliberately absent: the server resolves those from
 * the signed-in user's profile and overrides anything sent from here, so
 * there's only one definition of what {{senderName}} means and a profile
 * edit shows up in every preview without touching a template.
 *
 * Real values only — a field that's genuinely empty on the contact is simply
 * omitted, so the preview honestly shows it as missing rather than
 * substituting an empty string that looks resolved. */
export function buildRecipientValues(recipient: Contact | undefined): TemplateVariableValues {
  const values: TemplateVariableValues = {};
  if (!recipient) return values;
  if (recipient.firstName) values.firstName = recipient.firstName;
  if (recipient.lastName) values.lastName = recipient.lastName;
  const fullName = [recipient.firstName, recipient.lastName].filter(Boolean).join(" ");
  if (fullName) values.fullName = fullName;
  if (recipient.email) values.recipientEmail = recipient.email;
  if (recipient.company) values.company = recipient.company;
  if (recipient.jobTitle) values.jobTitle = recipient.jobTitle;
  return values;
}
