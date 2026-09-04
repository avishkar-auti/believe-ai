import { PERSONAS } from "./personaData.js";

/** Vertical tab list on desktop; a horizontal scroll row on mobile (the
 * brief doesn't specify a mobile layout for this section, so this mirrors
 * the same horizontal-scroll pattern already used for PersonaRail and the
 * connected-ecosystem row). */
export function PersonaTabs({ selected, onSelect }: { selected: number; onSelect: (index: number) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Believe.ai for"
      className="flex gap-2 overflow-x-auto pb-2 lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
    >
      {PERSONAS.map((persona, i) => {
        const active = i === selected;
        return (
          <button
            key={persona.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(i)}
            className={`flex shrink-0 items-center gap-2.5 rounded-control px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors duration-150 ${
              active ? "bg-accent-soft text-accent" : "text-fg-subtle hover:bg-surface-2 hover:text-fg"
            }`}
          >
            <persona.Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{persona.label}</span>
          </button>
        );
      })}
    </div>
  );
}
