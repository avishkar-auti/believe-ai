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
  // waitDays is optional because the initial email isn't waiting on anything —
  // spelling that out lets the "Wait N days" connector below narrow instead of
  // assuming every step has it.
  const steps: { day: number; label: string; detail: string; waitDays?: number }[] = [
    { day: 0, label: "Initial email", detail: initialLabel },
    ...followUps.map((f) => {
      day += f.delayDays;
      const templateName = templates?.find((t) => t.id === f.templateId)?.name;
      return { day, label: `Follow-up`, detail: templateName ?? "No template selected", waitDays: f.delayDays };
    }),
  ];

  return (
    <div className="space-y-0">
      {steps.map((s, i) => {
        const nextWait = steps[i + 1]?.waitDays;
        return (
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
          {nextWait !== undefined && (
            <div className="flex items-center gap-2 py-1 pl-4 text-[11px] text-fg-subtle">
              <span className="h-3 w-px bg-line" /> Wait {nextWait} day{nextWait === 1 ? "" : "s"}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
