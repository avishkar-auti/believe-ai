import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn.js";

/** Matches Input.tsx/Textarea.tsx's shape and styling so the three compose
 * naturally in the same form — a native <select> (not a custom listbox) for
 * accessibility and platform-native keyboard/touch behavior "for free". */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-line bg-surface pl-4 pr-9 text-sm text-fg transition-colors focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
    </div>
  );
});
