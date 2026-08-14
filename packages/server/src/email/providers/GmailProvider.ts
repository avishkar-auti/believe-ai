import { google } from "googleapis";
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "../EmailProvider.js";

export interface GmailProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
}

export class GmailProvider implements EmailProvider {
  readonly id = "gmail";

  constructor(private readonly config: GmailProviderConfig) {}

  private getClient() {
    const oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri,
    );
    oauth2Client.setCredentials({ refresh_token: this.config.refreshToken });
    return google.gmail({ version: "v1", auth: oauth2Client });
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const composer = new MailComposer({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    const message = await new Promise<Buffer>((resolve, reject) => {
      composer.compile().build((err: Error | null, msg: Buffer) => {
        if (err) reject(err);
        else resolve(msg);
      });
    });

    const raw = message.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const res = await this.getClient().users.messages.send({
      userId: "me",
      requestBody: { raw },
    });
    if (!res.data.id) throw new Error("Gmail did not return a message id");
    return { providerMessageId: res.data.id };
  }
}
