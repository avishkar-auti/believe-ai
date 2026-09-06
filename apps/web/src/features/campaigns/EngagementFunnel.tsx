import { ChevronRight } from "lucide-react";
import type { CampaignAnalytics } from "@believe-ai/shared";

/** Sent → Delivered → Open Detected → Clicked → Replied, each stage's card
 * tinted by how much of `sent` it retained — "Open Detected" deliberately
 * avoids implying certainty about whether a person actually read the email
 * (image-blocking clients under-report opens; this is a signal, not a read
 * receipt). Bounce isn't a funnel stage — it's a terminal failure, and no
 * provider webhook confirms it today (see the caller's disclaimer). */
const STAGES: { key: "sent" | "delivered" | "uniqueOpened" | "uniqueClicked" | "replied"; label: string; tint: string }[] = [
  { key: "sent", label: "Sent", tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { key: "delivered", label: "Delivered", tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { key: "uniqueOpened", label: "Opened", tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { key: "uniqueClicked", label: "Clicked", tint: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  { key: "replied", label: "Replied", tint: "bg-green-500/10 text-green-600 dark:text-green-400" },
];

export function EngagementFunnel({ analytics }: { analytics: CampaignAnalytics }) {
  const max = Math.max(analytics.sent, 1);

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {STAGES.map((stage, i) => {
        const count = analytics[stage.key];
        const pct = Math.round((count / max) * 100);
        return (
          <div key={stage.key} className="flex flex-1 items-stretch gap-2">
            <div className={`flex-1 rounded-xl p-3.5 ${stage.tint}`}>
              <p className="text-2xl font-semibold">{count}</p>
              <p className="text-xs font-medium opacity-80">{stage.label}</p>
              <p className="mt-1 text-[11px] opacity-60">{pct}%</p>
            </div>
            {i < STAGES.length - 1 && <ChevronRight className="my-auto h-4 w-4 shrink-0 text-ink-300 dark:text-ink-600" />}
          </div>
        );
      })}
    </div>
  );
}
