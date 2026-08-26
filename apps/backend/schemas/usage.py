"""Plan tiers and usage — mirrors packages/shared/src/constants/plans.ts
exactly (the single place limits are defined; changing a tier's allowance
there needs a matching one-line edit here until packages/shared's Zod
schemas are retired in favor of these Pydantic ones)."""

from __future__ import annotations

from pydantic import BaseModel

from models.user import PlanTier

# Sentinel for "no limit" — matches packages/shared's UNLIMITED. Deliberately
# not a huge int or infinity: this value round-trips through JSON as -1 on
# both sides, same as Node's choice for the same reason (JSON has no Infinity).
UNLIMITED = -1


class PlanLimits(BaseModel):
    maxContacts: int
    maxCampaigns: int
    maxDailyEmails: int
    maxAiGenerationsPerMonth: int


PLAN_LIMITS: dict[PlanTier, PlanLimits] = {
    "FREE": PlanLimits(maxContacts=500, maxCampaigns=5, maxDailyEmails=100, maxAiGenerationsPerMonth=100),
    "PRO": PlanLimits(maxContacts=10_000, maxCampaigns=100, maxDailyEmails=1_000, maxAiGenerationsPerMonth=2_000),
    "BUSINESS": PlanLimits(
        maxContacts=100_000, maxCampaigns=1_000, maxDailyEmails=5_000, maxAiGenerationsPerMonth=20_000
    ),
    "ENTERPRISE": PlanLimits(
        maxContacts=UNLIMITED, maxCampaigns=UNLIMITED, maxDailyEmails=UNLIMITED, maxAiGenerationsPerMonth=UNLIMITED
    ),
}


class PlanUsage(BaseModel):
    plan: PlanTier
    limits: PlanLimits
    contacts: int
    campaigns: int
    emailsSentToday: int
