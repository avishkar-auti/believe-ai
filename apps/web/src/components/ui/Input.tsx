import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-ink-900 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50 dark:focus:border-ink-300",
          className,
        )}
        {...props}
      />
    );
  },
);
