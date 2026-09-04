import { Check } from "lucide-react";
import { cn } from "../../lib/cn.js";

export const CAMPAIGN_STEPS = [
  { id: 1, title: "Details" },
  { id: 2, title: "Recipients" },
  { id: 3, title: "Content" },
  { id: 4, title: "Follow-ups" },
  { id: 5, title: "Review" },
] as const;

export function CampaignStepper({
  step,
  maxStepReached,
  onSelect,
}: {
  step: number;
  maxStepReached: number;
  onSelect: (s: number) => void;
}) {
  return (
    <div className="flex items-center overflow-x-auto rounded-panel border border-line bg-surface px-4 py-3.5 sm:px-5">
      {CAMPAIGN_STEPS.map((s, i) => {
        const isDone = s.id < step;
        const isActive = s.id === step;
        const isReachable = s.id <= maxStepReached;

        return (
          <div key={s.id} className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              disabled={!isReachable}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-xs font-semibold transition-all duration-150",
                isActive
                  ? "bg-accent text-accent-fg ring-4 ring-accent/15"
                  : isDone
                    ? "bg-accent text-accent-fg"
                    : "bg-surface-2 text-fg-subtle",
                isReachable && !isActive && "cursor-pointer hover:-translate-y-0.5",
                !isReachable && "cursor-not-allowed",
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : s.id}
            </button>
            <span className={cn("ml-2 hidden text-sm font-medium sm:inline", isActive ? "text-fg" : "text-fg-subtle")}>{s.title}</span>
            {i < CAMPAIGN_STEPS.length - 1 && (
              <span className={cn("mx-3 h-px w-6 transition-colors sm:w-10", s.id < step ? "bg-accent/50" : "bg-line")} aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
