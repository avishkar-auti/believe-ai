import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);
