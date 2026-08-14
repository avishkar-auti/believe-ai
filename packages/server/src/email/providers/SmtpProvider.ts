import nodemailer from "nodemailer";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "../EmailProvider.js";

export interface SmtpProviderConfig {
  host: string;
  port: number;
  user?: string;
  pass?: string;
}

export class SmtpProvider implements EmailProvider {
  readonly id = "smtp";
  private transporter: ReturnType<typeof nodemailer.createTransport>;

  constructor(config: SmtpProviderConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    });
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const info = await this.transporter.sendMail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments,
    });
    return { providerMessageId: info.messageId };
  }
}
