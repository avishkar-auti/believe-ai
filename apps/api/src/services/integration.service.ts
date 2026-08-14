import { google } from "googleapis";
import { env } from "../config/env.js";
import { IntegrationError, NotFoundError, ValidationError } from "../errors/AppError.js";
import { integrationRepository } from "../repositories/integration.repository.js";
import { encryptSecret } from "../utils/encryption.js";

function getGoogleOAuthClient() {
  if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET || !env.GMAIL_REDIRECT_URI) {
    throw new ValidationError("Gmail OAuth is not configured on this server");
  }
  return new google.auth.OAuth2(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET, env.GMAIL_REDIRECT_URI);
}

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
];

function assertOutlookConfigured(): void {
  if (!env.OUTLOOK_CLIENT_ID || !env.OUTLOOK_CLIENT_SECRET || !env.OUTLOOK_REDIRECT_URI) {
    throw new ValidationError("Outlook OAuth is not configured on this server");
  }
}

const OUTLOOK_SCOPES = "offline_access Mail.Send User.Read";
const OUTLOOK_AUTHORIZE_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const OUTLOOK_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

interface GraphTokenResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

interface GraphUserResponse {
  mail?: string;
  userPrincipalName?: string;
}

export const integrationService = {
  /** state carries the authenticated userId through Google's redirect round-trip. */
  getGmailConsentUrl(state: string): string {
    return getGoogleOAuthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: GMAIL_SCOPES,
      state,
    });
  },

  async handleGmailCallback(userId: string, code: string): Promise<{ email: string }> {
    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      throw new IntegrationError(
        "Google did not return a refresh token. Disconnect and reconnect Gmail to grant offline access.",
      );
    }
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data } = await oauth2.userinfo.get();
    if (!data.email) throw new IntegrationError("Could not determine the connected Gmail address");

    await integrationRepository.upsert(userId, "gmail", data.email, encryptSecret(tokens.refresh_token));
    return { email: data.email };
  },

  async disconnectGmail(userId: string): Promise<void> {
    const deleted = await integrationRepository.delete(userId, "gmail");
    if (!deleted) throw new NotFoundError("Gmail is not connected");
  },

  /** state carries the authenticated userId through Microsoft's redirect round-trip. */
  getOutlookConsentUrl(state: string): string {
    assertOutlookConfigured();
    const params = new URLSearchParams({
      client_id: env.OUTLOOK_CLIENT_ID!,
      response_type: "code",
      redirect_uri: env.OUTLOOK_REDIRECT_URI!,
      response_mode: "query",
      scope: OUTLOOK_SCOPES,
      state,
    });
    return `${OUTLOOK_AUTHORIZE_URL}?${params.toString()}`;
  },

  async handleOutlookCallback(userId: string, code: string): Promise<{ email: string }> {
    assertOutlookConfigured();

    const tokenRes = await fetch(OUTLOOK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.OUTLOOK_CLIENT_ID!,
        client_secret: env.OUTLOOK_CLIENT_SECRET!,
        redirect_uri: env.OUTLOOK_REDIRECT_URI!,
        code,
        grant_type: "authorization_code",
        scope: OUTLOOK_SCOPES,
      }),
    });
    const tokenData = (await tokenRes.json()) as GraphTokenResponse;
    if (!tokenRes.ok || !tokenData.refresh_token) {
      throw new IntegrationError(
        `Microsoft did not return a refresh token: ${tokenData.error_description ?? tokenRes.statusText}`,
      );
    }

    const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) throw new IntegrationError("Could not determine the connected Outlook address");
    const userData = (await userRes.json()) as GraphUserResponse;
    const email = userData.mail ?? userData.userPrincipalName;
    if (!email) throw new IntegrationError("Could not determine the connected Outlook address");

    await integrationRepository.upsert(userId, "outlook", email, encryptSecret(tokenData.refresh_token));
    return { email };
  },

  async disconnectOutlook(userId: string): Promise<void> {
    const deleted = await integrationRepository.delete(userId, "outlook");
    if (!deleted) throw new NotFoundError("Outlook is not connected");
  },

  async listStatus(userId: string) {
    const integrations = await integrationRepository.list(userId);
    return integrations.map((i) => ({
      provider: i.provider,
      email: i.email,
      connectedAt: i.connectedAt.toISOString(),
    }));
  },
};
