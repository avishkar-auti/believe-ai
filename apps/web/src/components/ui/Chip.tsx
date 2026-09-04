import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** The one selectable-pill pattern in the product — every feature used to
 * hand-roll this inline (Job Board's filter chips, skill tags, etc.); now a
 * shared primitive so they stay visually identical. */
export function Chip({ className, selected = false, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-pill border px-2.5 py-1 text-xs font-medium transition-colors active:scale-[0.98]",
        selected
          ? "border-accent bg-accent-soft text-accent"
          : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
        className,
      )}
      {...props}
    />
  );
}
