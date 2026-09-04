import type { ReactNode } from "react";
import { cn } from "../../lib/cn.js";

interface PageHeaderProps {
  /** Small uppercase kicker above the title — names the section a page
   * belongs to (e.g. "Outreach", "Career Tools") rather than restating the
   * title. Optional; omit for pages where it'd just be noise. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** The title/description/actions row every top-level feature page opens with. */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-section uppercase text-accent">{eyebrow}</p>}
        <h1 className="text-h1 text-fg">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-label font-normal text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
