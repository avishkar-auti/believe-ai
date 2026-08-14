import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { PLAN_LIMITS, PLAN_TIERS, UNLIMITED, type PlanTier } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { cn } from "../../lib/cn.js";
import { fetchUsage } from "../settings/usageApi.js";

const PLAN_COPY: Record<PlanTier, { tagline: string; highlight: boolean }> = {
  FREE: { tagline: "Get started with outreach and career tools.", highlight: false },
  PRO: { tagline: "For active job seekers running real campaigns.", highlight: true },
  BUSINESS: { tagline: "For teams scaling outreach across the org.", highlight: false },
  ENTERPRISE: { tagline: "Custom limits and support for large organizations.", highlight: false },
};

function formatLimit(n: number): string {
  return n === UNLIMITED ? "Unlimited" : n.toLocaleString();
}

export function PricingPage() {
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: fetchUsage });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Pricing</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">Every plan includes the full career toolkit — limits scale with outreach volume.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_TIERS.map((tier) => {
          const limits = PLAN_LIMITS[tier];
          const copy = PLAN_COPY[tier];
          const isCurrent = usage?.plan === tier;

          const rows = [
            { label: "Contacts", value: formatLimit(limits.maxContacts) },
            { label: "Campaigns", value: formatLimit(limits.maxCampaigns) },
            { label: "Emails / day", value: formatLimit(limits.maxDailyEmails) },
            { label: "AI generations / month", value: formatLimit(limits.maxAiGenerationsPerMonth) },
          ];

          return (
            <Card
              key={tier}
              className={cn("flex flex-col", copy.highlight && "border-brand-500 ring-1 ring-brand-500")}
            >
              <CardBody className="flex flex-1 flex-col">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="font-semibold text-ink-900 dark:text-white">{tier[0]}{tier.slice(1).toLowerCase()}</h2>
                  {isCurrent && <Badge tone="info">Current</Badge>}
                </div>
                <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">{copy.tagline}</p>

                <ul className="flex-1 space-y-2 text-sm">
                  {rows.map((row) => (
                    <li key={row.label} className="flex items-center gap-2 text-ink-700 dark:text-ink-200">
                      <Check className="h-4 w-4 shrink-0 text-brand-500" />
                      <span>
                        {row.value} <span className="text-ink-400">{row.label.toLowerCase()}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-ink-400">
        Want to change plans? Reach out via the feedback widget in the sidebar and we'll get it sorted.
      </p>
    </div>
  );
}
