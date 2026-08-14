import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * All environment variables the API depends on, validated at startup so a
 * misconfigured deploy fails fast instead of surfacing as a runtime 500
 * somewhere deep in a request. EMAIL_PROVIDER drives the provider
 * abstraction dynamically — no provider name is ever hardcoded into
 * business logic, only read from here. (AI provider config lives in
 * apps/ai-service now — the API no longer calls an AI provider directly.)
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  APP_BASE_URL: z.string().default("http://localhost:5173"),
  API_BASE_URL: z.string().default("http://localhost:4000"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_CLIENT_EMAIL: z.string().min(1, "FIREBASE_CLIENT_EMAIL is required"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),

  /** 32-byte hex key used for AES-256-GCM encryption of OAuth tokens. */
  ENCRYPTION_KEY: z
    .string()
    .length(64, "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"),

  /**
   * Explicit override for which EmailProvider implementation campaigns send
   * through. Leave unset (the default) to let the worker pick automatically
   * based on which integration (Gmail or Outlook) the sending user has
   * connected; only set this to force SMTP for local testing.
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

  EMAIL_DAILY_LIMIT_DEFAULT: z.coerce.number().int().positive().default(200),
  EMAIL_SEND_CONCURRENCY: z.coerce.number().int().positive().default(3),

  /**
   * The Python AI service — needed here (unlike the rest of the API) because
   * resume embedding is computed by a model, but the resulting vectors are
   * written back into Mongo by this service, not apps/ai-service (which
   * stays read-only). The caller's own Firebase bearer token is forwarded
   * as-is, since apps/ai-service accepts a real user token just like it
   * does from the web app.
   */
  AI_SERVICE_URL: z.string().default("http://localhost:8000"),

  /**
   * Judge0 CE via RapidAPI — powers the Interview Prep code sandbox. Optional:
   * unlike the AI provider cascade, there's no fallback for code execution,
   * so when this is unset the sandbox endpoint returns a clear error instead
   * of attempting a call that can only fail (mirrors how the reference
   * project documents this exact integration's failure mode).
   */
  RAPIDAPI_KEY: z.string().optional(),

  /**
   * JSearch via RapidAPI — powers external listings on the Job Board.
   * Optional: unset means the board shows internal (recruiter-posted) jobs
   * only, which is a perfectly usable degraded state, not an error.
   */
  RAPIDAPI_JSEARCH_KEY: z.string().optional(),

  /**
   * LinkedIn Data API via RapidAPI — powers Job Outreach's lead discovery
   * (finding hiring-team/employee contacts at a target company). Optional:
   * unset means lead discovery returns no contacts rather than erroring —
   * the JobIntel and outreach-draft flows work fully without it.
   */
  RAPIDAPI_LINKEDIN_KEY: z.string().optional(),

  /**
   * YouTube Data API v3 — powers real video resources on Learning Roadmap
   * stages. Optional: unset means roadmap stages show documentation only,
   * video sections report "temporarily unavailable" instead of erroring.
   */
  YOUTUBE_API_KEY: z.string().optional(),

  /**
   * TURN relay for the Live Practice Room — optional. Without it, WebRTC
   * falls back to a public STUN server (always included), which works for
   * most direct peer-to-peer connections but not networks that block them.
   */
  TURN_URLS: z.string().optional(),
  TURN_USERNAME: z.string().optional(),
  TURN_CREDENTIAL: z.string().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export type Env = typeof env;
