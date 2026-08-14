import {
  IntegrationModel,
  GmailProvider,
  OutlookProvider,
  SmtpProvider,
  decryptSecret,
  type EmailProvider,
} from "@believe-ai/server";
import { env } from "../config/env.js";

function buildGmailProvider(refreshToken: string): GmailProvider {
  if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET || !env.GMAIL_REDIRECT_URI) {
    throw new Error("Gmail OAuth is not configured on the worker");
  }
  return new GmailProvider({
    clientId: env.GMAIL_CLIENT_ID,
    clientSecret: env.GMAIL_CLIENT_SECRET,
    redirectUri: env.GMAIL_REDIRECT_URI,
    refreshToken,
  });
}

function buildOutlookProvider(refreshToken: string): OutlookProvider {
  if (!env.OUTLOOK_CLIENT_ID || !env.OUTLOOK_CLIENT_SECRET || !env.OUTLOOK_REDIRECT_URI) {
    throw new Error("Outlook OAuth is not configured on the worker");
  }
  return new OutlookProvider({
    clientId: env.OUTLOOK_CLIENT_ID,
    clientSecret: env.OUTLOOK_CLIENT_SECRET,
    redirectUri: env.OUTLOOK_REDIRECT_URI,
    refreshToken,
  });
}

/**
 * Picks whichever EmailProvider the sending user actually connected —
 * campaign sends and meeting-invite emails alike never hardcode a single
 * provider (spec 5.12). EMAIL_PROVIDER=smtp is the one explicit override,
 * for local testing without any real OAuth app configured.
 */
export async function resolveProvider(userId: string): Promise<EmailProvider> {
  if (env.EMAIL_PROVIDER === "smtp") {
    if (!env.SMTP_HOST || !env.SMTP_PORT) throw new Error("SMTP is not configured");
    return new SmtpProvider({ host: env.SMTP_HOST, port: env.SMTP_PORT, user: env.SMTP_USER, pass: env.SMTP_PASS });
  }

  const integration = await IntegrationModel.findOne({ userId, provider: { $in: ["gmail", "outlook"] } });
  if (!integration) {
    throw new Error("No email provider connected. Connect Gmail or Outlook in Settings before sending.");
  }

  const refreshToken = decryptSecret(integration.encryptedRefreshToken, env.ENCRYPTION_KEY);
  return integration.provider === "outlook" ? buildOutlookProvider(refreshToken) : buildGmailProvider(refreshToken);
}
