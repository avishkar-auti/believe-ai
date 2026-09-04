import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn.js";

/** One collapsible block in the filter sidebar — Location/Job type/Experience
 * default open, Salary/Company/Skills/Date posted default collapsed, per the
 * brief's density guidance. `count` renders a small selected-count badge next
 * to the label when this section has an active filter. */
export function FilterSection({
  label,
  count,
  defaultOpen = false,
  children,
}: {
  label: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
          {label}
          {Boolean(count) && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-pill bg-accent-soft px-1 text-[10px] font-bold text-accent">
              {count}
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-fg-subtle transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && <div className="mt-2.5 space-y-2.5">{children}</div>}
    </div>
  );
}
