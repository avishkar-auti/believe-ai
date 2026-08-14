import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"),

  /**
   * Explicit override for which EmailProvider implementation to send
   * through. Leave unset (the default) to pick automatically based on
   * which integration (Gmail or Outlook) the sending user has connected;
   * only set this to force SMTP for local testing.
   */
  EMAIL_PROVIDER: z.enum(["gmail", "outlook", "smtp"]).optional(),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REDIRECT_URI: z.string().optional(),

  OUTLOOK_CLIENT_ID: z.string().optional(),
  OUTLOOK_CLIENT_SECRET: z.string().optional(),
  OUTLOOK_REDIRECT_URI: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  EMAIL_SEND_CONCURRENCY: z.coerce.number().int().positive().default(3),
  API_BASE_URL: z.string().default("http://localhost:4000"),
  /** Used to build the Live Practice Room join link in meeting invite/reminder emails. */
  APP_BASE_URL: z.string().default("http://localhost:5173"),

  /** The Python AI service (apps/ai-service) — the only AI implementation in the product. */
  AI_SERVICE_URL: z.string().default("http://localhost:8000"),
  /** Shared secret for this worker's backend-to-backend AI calls — must match apps/ai-service's INTERNAL_SERVICE_KEY. */
  INTERNAL_SERVICE_KEY: z.string().min(1, "INTERNAL_SERVICE_KEY is required"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid worker environment variables:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
