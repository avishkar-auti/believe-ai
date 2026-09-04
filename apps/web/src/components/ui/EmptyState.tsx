import type { ReactNode } from "react";
import { cn } from "../../lib/cn.js";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, secondaryAction, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line py-16 text-center",
        className,
      )}
    >
      {icon}
      <p className="text-label font-medium text-fg">{title}</p>
      {description && <p className="max-w-sm text-caption text-fg-muted">{description}</p>}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
