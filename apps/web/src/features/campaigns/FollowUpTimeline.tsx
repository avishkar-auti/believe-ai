import type { CampaignFollowUp, Template } from "@believe-ai/shared";
import { Mail } from "lucide-react";
import { cn } from "../../lib/cn.js";

/** Derived entirely from real campaign state — the day numbers are a running
 * sum of real delayDays, never hardcoded. Shared by CampaignSummary (compact)
 * and CampaignReviewStep (fuller). */
export function FollowUpTimeline({
  initialLabel,
  followUps,
  templates,
  compact = false,
}: {
  initialLabel: string;
  followUps: CampaignFollowUp[];
  templates: Template[] | undefined;
  compact?: boolean;
}) {
  let day = 0;
  const steps = [
    { day: 0, label: "Initial email", detail: initialLabel },
    ...followUps.map((f) => {
      day += f.delayDays;
      const templateName = templates?.find((t) => t.id === f.templateId)?.name;
      return { day, label: `Follow-up`, detail: templateName ?? "No template selected", waitDays: f.delayDays };
    }),
  ];

  return (
    <div className="space-y-0">
      {steps.map((s, i) => (
        <div key={i}>
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-lg border px-3 py-2.5",
              i === 0 ? "border-positive/25 bg-positive/5" : "border-line bg-surface-2",
            )}
          >
            <Mail className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", i === 0 ? "text-positive" : "text-fg-subtle")} />
            <div className="min-w-0">
              <p className="text-caption font-semibold text-fg">Day {s.day}</p>
              <p className={cn("truncate text-caption text-fg-muted", compact && "text-[11px]")}>
                {s.label} {i > 0 && `#${i}`} — {s.detail}
              </p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex items-center gap-2 py-1 pl-4 text-[11px] text-fg-subtle">
              <span className="h-3 w-px bg-line" /> Wait {steps[i + 1]!.waitDays} day{steps[i + 1]!.waitDays === 1 ? "" : "s"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
