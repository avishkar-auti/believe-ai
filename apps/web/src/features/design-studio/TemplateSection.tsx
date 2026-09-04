import { useState } from "react";
import { Layers } from "lucide-react";
import { cn } from "../../lib/cn.js";
import { EXPLORE_IDEAS, IDEA_CATEGORIES } from "./studioConfig.js";

/** "Explore ideas" — curated starting prompts, not a real saved-template
 * library (no templates model exists in the backend yet; see designApi.ts).
 * Each card populates the composer with a real prompt rather than pointing
 * at a pre-built design that doesn't exist. */
export function TemplateSection({ onSelect }: { onSelect: (prompt: string) => void }) {
  const [category, setCategory] = useState<(typeof IDEA_CATEGORIES)[number]>("All");
  const filtered = category === "All" ? EXPLORE_IDEAS : EXPLORE_IDEAS.filter((i) => i.category === category);

  return (
    <section id="explore-ideas" className="mt-14 scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h3 text-fg">Explore ideas</h2>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {IDEA_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-pill px-3 py-1.5 text-xs font-medium transition-colors",
              category === c ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {filtered.map((idea) => (
          <button
            key={idea.name}
            type="button"
            onClick={() => onSelect(idea.prompt)}
            className="group flex w-48 shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-surface text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
          >
            <div className="flex h-28 items-center justify-center border-b border-line bg-gradient-to-br from-accent-soft to-surface-2">
              <Layers className="h-6 w-6 text-accent/60 transition-transform duration-150 group-hover:scale-110" />
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-semibold text-fg">{idea.name}</p>
              <p className="mt-0.5 text-xs text-fg-subtle">{idea.category}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
