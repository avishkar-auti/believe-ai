import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-900/[0.06] dark:bg-ink-700 dark:text-ink-200 dark:ring-white/[0.06]",
  success: "bg-lime-500/15 text-lime-600 ring-1 ring-inset ring-lime-500/20 dark:text-lime-400",
  warning: "bg-amber-500/15 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/20 dark:text-red-400",
  info: "bg-brand-500/10 text-brand-600 ring-1 ring-inset ring-brand-500/20 dark:text-brand-300",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
