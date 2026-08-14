export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendEmailInput {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  providerMessageId: string;
}

/**
 * The worker sends through this interface only — never a concrete provider
 * class — so a new provider (Outlook, SES, ...) never requires touching
 * campaign/queue logic (spec 5.12).
 */
export interface EmailProvider {
  readonly id: string;
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}
