import type { ResourceView } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";

const OPTIONS: { value: ResourceView; label: string }[] = [
  { value: "both", label: "All" },
  { value: "documentation", label: "Docs" },
  { value: "youtube", label: "Videos" },
];

export function ResourceFilter({ value, onChange }: { value: ResourceView; onChange: (v: ResourceView) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-caption font-medium text-fg-subtle">Resources</span>
      <div role="radiogroup" aria-label="Resource type" className="flex items-center gap-0.5 rounded-lg border border-line p-0.5">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                active ? "bg-accent-soft text-accent" : "text-fg-subtle hover:text-fg-muted",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
