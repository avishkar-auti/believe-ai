import { Sparkles } from "lucide-react";

const QUICK_ACTIONS = ["Find jobs", "Improve resume", "Practice interview", "Plan my week"];

/** The hero's visually dominant card — Believe AI, the assistant that ties
 * every product area together. Illustrative UI preview, not a live session. */
export function HeroCenterCard() {
  return (
    <div className="w-[280px] rounded-panel border border-line bg-surface p-5 shadow-lift sm:w-[320px]">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-control bg-accent-soft text-accent">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">Believe AI</p>
          <p className="text-[11px] text-fg-subtle">Your context copilot</p>
        </div>
      </div>

      <div className="mt-4 rounded-control bg-surface-2 px-3.5 py-3">
        <p className="text-[13px] text-fg">Good morning, Alex 👋</p>
        <p className="mt-0.5 text-[13px] text-fg-muted">How can I help you today?</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {QUICK_ACTIONS.map((action) => (
          <span
            key={action}
            className="truncate rounded-control border border-line bg-surface px-2.5 py-1.5 text-center text-[11px] font-medium text-fg-muted"
          >
            {action}
          </span>
        ))}
      </div>
    </div>
  );
}
