import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

type Level = 1 | 2 | 3 | 4;

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** 1 = page panels, 2 = cards/sections, 3 = floating UI, 4 = modals. */
  level?: Level;
  /** Adds the illuminated top edge used by the liquid appearance. */
  edge?: boolean;
  /** Hover response: border brightens and elevation lifts slightly. */
  interactive?: boolean;
}

const LEVEL_CLASS: Record<Level, string> = {
  1: "surface-1",
  2: "surface-2",
  3: "surface-3",
  4: "surface-4",
};

/**
 * The single elevated container in the product. Levels map to the token-driven
 * surface scale so light, dark and liquid appearances all resolve from one
 * declaration instead of per-theme class lists.
 */
export function Surface({ className, level = 2, edge = true, interactive = false, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        LEVEL_CLASS[level],
        edge && "surface-edge",
        interactive &&
          "transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-px hover:border-line-strong hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}

/** A hairline divider that follows the token line colour. */
export function SurfaceDivider({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn("h-px w-full bg-line", className)} {...props} />;
}

/** Small uppercase section label — carries hierarchy without adding a card. */
export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-section uppercase text-fg-subtle", className)} {...props} />;
}
