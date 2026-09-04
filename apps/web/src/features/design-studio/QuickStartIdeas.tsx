import { ArrowRight, BarChart3, Rocket, Smartphone, User, type LucideIcon } from "lucide-react";
import { QUICK_START_IDEAS } from "./studioConfig.js";

const ICONS: Record<string, LucideIcon> = { User, BarChart3, Smartphone, Rocket };

export function QuickStartIdeas({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Start with an idea</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_START_IDEAS.map((idea) => {
          const Icon = ICONS[idea.icon];
          return (
            <button
              key={idea.category}
              type="button"
              onClick={() => onSelect(idea.prompt)}
              className="group flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent transition-transform duration-150 group-hover:scale-110">
                {Icon && <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fg">{idea.category}</span>
                <span className="mt-0.5 block truncate text-xs text-fg-muted">{idea.prompt}</span>
              </span>
              <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-fg-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
