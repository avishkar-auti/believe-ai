import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Moderate radius, not a pill — and hover states move by shadow/color, not
 * scale. A button that grows on hover and shrinks on every click is the
 * single most common "AI wrote this" animation tell; real products signal
 * hover with a shade/elevation shift and reserve motion for the press itself. */
const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(var(--accent)/0.3)] hover:bg-accent-hover hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_4px_14px_-2px_rgb(var(--accent)/0.5)]",
  secondary: "bg-surface text-fg border border-line hover:border-line-strong hover:bg-surface-2",
  accent:
    "bg-positive text-white shadow-[0_1px_2px_rgb(var(--positive)/0.3)] hover:bg-positive/90 hover:shadow-[0_4px_14px_-2px_rgb(var(--positive)/0.45)]",
  ghost: "text-fg-muted hover:bg-fg/[0.06] hover:text-fg",
  danger:
    "bg-critical text-white shadow-[0_1px_2px_rgb(var(--critical)/0.3)] hover:bg-critical/90 hover:shadow-[0_4px_14px_-2px_rgb(var(--critical)/0.45)]",
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
        "inline-flex items-center justify-center gap-2 rounded-control font-medium transition-[background-color,border-color,box-shadow,color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
});
