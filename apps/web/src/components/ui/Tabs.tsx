import { useId, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn.js";
import { EASE, MOTION } from "../../lib/motion.js";

export interface TabItem {
  value: string;
  label: string;
}

/** The one tab-bar pattern in the product — an underline indicator that
 * slides between the active tab (generalizes the pattern first used in
 * community/CommunityFilterBar.tsx). Each instance gets its own animation
 * namespace via useId() so multiple tab bars on one page don't cross-fade
 * into each other. */
export function Tabs({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const namespace = useId();

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const direction = e.key === "ArrowRight" ? 1 : -1;
    const next = items[(index + direction + items.length) % items.length];
    if (next) onChange(next.value);
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("flex items-center gap-1 overflow-x-auto", className)}>
      {items.map((item, i) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative shrink-0 px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              active ? "text-fg" : "text-fg-subtle hover:text-fg",
            )}
          >
            {item.label}
            {active && (
              <motion.span
                layoutId={`${namespace}-tab-indicator`}
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"
                transition={{ duration: MOTION.normal, ease: EASE }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
