import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Fully-rounded pills. Primary carries the brand gradient + a tinted glow so the main CTA reads as the one colorful thing on an otherwise neutral page. */
const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_1px_1px_rgba(255,255,255,0.15)_inset,0_4px_12px_-2px_rgba(67,83,255,0.45)] hover:from-brand-400 hover:to-brand-500 hover:shadow-[0_1px_1px_rgba(255,255,255,0.15)_inset,0_6px_18px_-2px_rgba(67,83,255,0.55)] disabled:from-ink-300 disabled:to-ink-300 disabled:shadow-none dark:disabled:from-ink-700 dark:disabled:to-ink-700",
  secondary:
    "bg-white text-ink-800 border border-ink-200 hover:border-ink-300 hover:bg-ink-50 hover:shadow-sm dark:bg-transparent dark:text-ink-100 dark:border-ink-600 dark:hover:bg-ink-800",
  accent:
    "bg-gradient-to-b from-lime-400 to-lime-500 text-ink-900 shadow-[0_4px_12px_-2px_rgba(139,195,74,0.4)] hover:from-lime-400/90 hover:to-lime-500/90 disabled:from-ink-300 disabled:to-ink-300 disabled:shadow-none",
  ghost: "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800",
  danger:
    "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_4px_12px_-2px_rgba(220,38,38,0.4)] hover:from-red-400 hover:to-red-500 disabled:from-red-300 disabled:to-red-300 disabled:shadow-none",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
});
