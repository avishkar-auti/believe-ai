import {
  DEFAULT_PLAN_TIER,
  PLAN_LIMITS,
  UNLIMITED,
  isWithinLimit,
  type PlanTier,
  type PlanUsage,
} from "@believe-ai/shared";
import { contactRepository } from "../repositories/contact.repository.js";
import { campaignRepository } from "../repositories/campaign.repository.js";
import { emailLogRepository } from "../repositories/emailLog.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { NotFoundError, PlanLimitExceededError } from "../errors/AppError.js";

/** Start of the current UTC day — the window daily send limits are measured over. */
function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function describe(limit: number): string {
  return limit === UNLIMITED ? "unlimited" : String(limit);
}

async function getPlan(userId: string): Promise<PlanTier> {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  return (user.plan as PlanTier) ?? DEFAULT_PLAN_TIER;
}

/**
 * Enforces plan allowances. Every limit is read from PLAN_LIMITS rather
 * than hardcoded here, so changing a tier is a one-line edit in
 * packages/shared (spec 51).
 *
 * These are best-effort checks, not transactional reservations: two
 * concurrent imports could each pass the check and together overshoot the
 * cap slightly. That's an acceptable trade for not locking on every write —
 * the limits exist to stop runaway usage, not to be accounting-exact.
 */
export const usageService = {
  async getUsage(userId: string): Promise<PlanUsage> {
    const plan = await getPlan(userId);
    const [contacts, campaigns, emailsSentToday] = await Promise.all([
      contactRepository.countByUserId(userId),
      campaignRepository.countByUserId(userId),
      emailLogRepository.countSentSince(userId, startOfUtcDay()),
    ]);

    return { plan, limits: PLAN_LIMITS[plan], contacts, campaigns, emailsSentToday };
  },

  /** Throws if adding `additional` contacts would exceed the plan. */
  async assertCanAddContacts(userId: string, additional: number): Promise<void> {
    const plan = await getPlan(userId);
    const limit = PLAN_LIMITS[plan].maxContacts;
    const current = await contactRepository.countByUserId(userId);

    if (!isWithinLimit(current, additional, limit)) {
      throw new PlanLimitExceededError(
        `Your ${plan} plan allows ${describe(limit)} contacts and you have ${current}. ` +
          `Adding ${additional} more would exceed it — upgrade your plan or remove some contacts.`,
      );
    }
  },

  async assertCanCreateCampaign(userId: string): Promise<void> {
    const plan = await getPlan(userId);
    const limit = PLAN_LIMITS[plan].maxCampaigns;
    const current = await campaignRepository.countByUserId(userId);

    if (!isWithinLimit(current, 1, limit)) {
      throw new PlanLimitExceededError(
        `Your ${plan} plan allows ${describe(limit)} campaigns and you have ${current}. Upgrade your plan to create more.`,
      );
    }
  },

  /**
   * Checked at launch, against emails already sent today. A campaign larger
   * than the remaining daily allowance is rejected up front rather than
   * silently truncated — the user should decide what to cut.
   */
  async assertCanSendEmails(userId: string, recipientCount: number): Promise<void> {
    const plan = await getPlan(userId);
    const limit = PLAN_LIMITS[plan].maxDailyEmails;
    const sentToday = await emailLogRepository.countSentSince(userId, startOfUtcDay());

    if (!isWithinLimit(sentToday, recipientCount, limit)) {
      throw new PlanLimitExceededError(
        `Your ${plan} plan allows ${describe(limit)} emails per day and you've sent ${sentToday} today. ` +
          `Launching to ${recipientCount} recipients would exceed it — upgrade your plan or launch a smaller campaign.`,
      );
    }
  },
};
