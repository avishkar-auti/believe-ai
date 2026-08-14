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
    throw new Error("Gmail OAuth is not configured on the server");
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
    throw new Error("Outlook OAuth is not configured on the server");
  }
  return new OutlookProvider({
    clientId: env.OUTLOOK_CLIENT_ID,
    clientSecret: env.OUTLOOK_CLIENT_SECRET,
    redirectUri: env.OUTLOOK_REDIRECT_URI,
    refreshToken,
  });
}

/**
 * Same resolution logic as apps/worker/src/services/emailProviderResolver.ts
 * (campaign sends) — duplicated rather than shared because each app already
 * declares its own zod-validated env module, and the two call sites (a
 * queued campaign step vs. an immediate outreach send from a request) don't
 * share a runtime. Picks whichever provider the sending user actually
 * connected; never a hardcoded single provider.
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
