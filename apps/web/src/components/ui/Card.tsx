import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** "soft" is the flat grey tile used for feature/bento cards; "raised" is the default white surface. */
  tone?: "raised" | "soft";
}

export function Card({ className, tone = "raised", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card",
        tone === "raised"
          ? "border border-ink-200/70 bg-white shadow-card ring-1 ring-inset ring-white/60 dark:border-ink-700 dark:bg-ink-800 dark:ring-white/[0.03]"
          : "bg-ink-100/70 dark:bg-ink-800/60",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-ink-100 px-6 py-4 dark:border-ink-700", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}
