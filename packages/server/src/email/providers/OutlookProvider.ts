import type { EmailProvider, SendEmailInput, SendEmailResult } from "../EmailProvider.js";

export interface OutlookProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
}

interface GraphTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

/**
 * Sends via Microsoft Graph's sendMail endpoint. Plain fetch rather than a
 * client SDK — the OAuth2 refresh-token grant and the send call are both
 * simple enough that a dependency isn't worth it, and it keeps this
 * provider as easy to audit as GmailProvider.
 */
export class OutlookProvider implements EmailProvider {
  readonly id = "outlook";

  constructor(private readonly config: OutlookProviderConfig) {}

  private async getAccessToken(): Promise<string> {
    const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        refresh_token: this.config.refreshToken,
        grant_type: "refresh_token",
        scope: "offline_access Mail.Send User.Read",
      }),
    });

    const data = (await res.json()) as GraphTokenResponse;
    if (!res.ok || !data.access_token) {
      throw new Error(`Outlook token refresh failed: ${data.error_description ?? res.statusText}`);
    }
    return data.access_token;
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const accessToken = await this.getAccessToken();

    const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          subject: input.subject,
          body: { contentType: "HTML", content: input.html },
          toRecipients: [{ emailAddress: { address: input.to } }],
          attachments: input.attachments?.map((a) => ({
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: a.filename,
            contentType: a.contentType ?? "application/octet-stream",
            contentBytes: a.content.toString("base64"),
          })),
        },
        saveToSentItems: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`Outlook send failed: ${res.status} ${await res.text()}`);
    }

    // Graph's sendMail returns 202 Accepted with no body and no message id —
    // there's nothing else to report back as a provider message id.
    return { providerMessageId: `outlook-${Date.now()}` };
  }
}
