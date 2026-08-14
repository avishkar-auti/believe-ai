import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink-200 py-16 text-center dark:border-ink-700">
      <p className="text-base font-medium text-ink-800 dark:text-ink-100">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>}
      {action}
    </div>
  );
}
