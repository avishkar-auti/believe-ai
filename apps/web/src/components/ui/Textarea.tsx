import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);
