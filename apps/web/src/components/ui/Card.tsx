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
        tone === "raised" ? "border border-line bg-surface shadow-card ring-1 ring-inset ring-fg/[0.03]" : "bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-line px-6 py-4", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}
