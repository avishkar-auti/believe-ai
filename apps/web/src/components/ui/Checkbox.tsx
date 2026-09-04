import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Optional inline label — renders as a real <label>, not just adjacent text. */
  label?: string;
}

/** A native checkbox styled via `accent-color` rather than a custom box —
 * keeps real platform checkbox behavior (keyboard, touch, screen readers)
 * instead of reimplementing it, matching the accent-styling already used for
 * ad-hoc checkboxes elsewhere in the app (e.g. the Notes action-items list). */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, id, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      type="checkbox"
      id={id}
      className={cn("h-4 w-4 shrink-0 rounded border-line accent-accent disabled:cursor-not-allowed disabled:opacity-60", className)}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg">
      {input}
      {label}
    </label>
  );
});
