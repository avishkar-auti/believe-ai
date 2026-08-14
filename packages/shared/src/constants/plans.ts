/**
 * Plan tiers and their limits — the single place limits are defined, so
 * nothing hardcodes a number deep in business logic (spec 51). Changing a
 * tier's allowance is a one-line edit here.
 */
export const PLAN_TIERS = ["FREE", "PRO", "BUSINESS", "ENTERPRISE"] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

/**
 * Sentinel for "no limit". Deliberately not Infinity: these limits are sent
 * to the web client as JSON, and JSON.stringify(Infinity) is `null`.
 * Always compare via isWithinLimit / remainingAllowance rather than testing
 * this value at call sites.
 */
export const UNLIMITED = -1;

export interface PlanLimits {
  /** Maximum contacts the account may store. */
  maxContacts: number;
  /** Maximum campaigns the account may create (any status). */
  maxCampaigns: number;
  /** Maximum emails the account may send per calendar day (UTC). */
  maxDailyEmails: number;
  /**
   * Maximum AI generations per calendar month.
   *
   * NOT ENFORCED YET: AI runs entirely in apps/ai-service (Python), which is
   * read-only against MongoDB and so can't record usage. Enforcing this
   * needs that service to gain a usage-write path. Defined here so the plan
   * shape is complete and the limit lands in one place when it is wired up.
   */
  maxAiGenerationsPerMonth: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    maxContacts: 500,
    maxCampaigns: 5,
    maxDailyEmails: 100,
    maxAiGenerationsPerMonth: 100,
  },
  PRO: {
    maxContacts: 10_000,
    maxCampaigns: 100,
    maxDailyEmails: 1_000,
    maxAiGenerationsPerMonth: 2_000,
  },
  BUSINESS: {
    maxContacts: 100_000,
    maxCampaigns: 1_000,
    maxDailyEmails: 5_000,
    maxAiGenerationsPerMonth: 20_000,
  },
  ENTERPRISE: {
    maxContacts: UNLIMITED,
    maxCampaigns: UNLIMITED,
    maxDailyEmails: UNLIMITED,
    maxAiGenerationsPerMonth: UNLIMITED,
  },
};

export const DEFAULT_PLAN_TIER: PlanTier = "FREE";

/** True if adding `additional` more would stay within `limit`. */
export function isWithinLimit(current: number, additional: number, limit: number): boolean {
  if (limit === UNLIMITED) return true;
  return current + additional <= limit;
}

/** How many more are allowed, or UNLIMITED. Never negative. */
export function remainingAllowance(current: number, limit: number): number {
  if (limit === UNLIMITED) return UNLIMITED;
  return Math.max(0, limit - current);
}

/** What a user has consumed against their plan, for display and enforcement. */
export interface PlanUsage {
  plan: PlanTier;
  limits: PlanLimits;
  contacts: number;
  campaigns: number;
  emailsSentToday: number;
}
