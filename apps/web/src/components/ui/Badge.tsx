import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg-muted ring-1 ring-inset ring-fg/[0.06]",
  success: "bg-positive/15 text-positive ring-1 ring-inset ring-positive/20",
  warning: "bg-caution/15 text-caution ring-1 ring-inset ring-caution/20",
  danger: "bg-critical/10 text-critical ring-1 ring-inset ring-critical/20",
  info: "bg-informative/10 text-informative ring-1 ring-inset ring-informative/20",
  accent: "bg-accent-soft text-accent ring-1 ring-inset ring-accent/20",
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
