import type { ReactNode } from "react";
import { Lightbulb, ListChecks, Sparkles, Users, X } from "lucide-react";
import { cn } from "../../../lib/cn.js";

export type PanelTab = "questions" | "board" | "people" | "recap";

const TABS: Array<{ id: PanelTab; label: string; icon: typeof Users }> = [
  { id: "questions", label: "Questions", icon: ListChecks },
  { id: "board", label: "Board", icon: Lightbulb },
  { id: "people", label: "People", icon: Users },
  { id: "recap", label: "Recap", icon: Sparkles },
];

/**
 * One panel, four tabs — the room never stacks competing cards next to the
 * video. On mobile the same component renders as a bottom sheet.
 */
export function RoomSidePanel({
  tab,
  onTabChange,
  onClose,
  peopleCount,
  ideaCount,
  children,
  className,
}: {
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onClose: () => void;
  peopleCount: number;
  ideaCount: number;
  children: ReactNode;
  className?: string;
}) {
  const counts: Partial<Record<PanelTab, number>> = { people: peopleCount, board: ideaCount };

  return (
    <aside
      className={cn("surface-2 surface-edge flex min-h-0 flex-col rounded-2xl", className)}
      aria-label="Session panel"
    >
      <div className="flex items-center gap-1 border-b border-line p-2">
        <div className="flex min-w-0 flex-1 gap-1" role="tablist" aria-label="Session panel tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-pill px-2 py-1.5 text-caption font-medium transition-colors",
                tab === id ? "bg-fg/[0.08] text-fg" : "text-fg-subtle hover:text-fg",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
              {counts[id] ? <span className="tabular-nums text-fg-subtle">{counts[id]}</span> : null}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close session panel"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-pill text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-3">{children}</div>
    </aside>
  );
}
