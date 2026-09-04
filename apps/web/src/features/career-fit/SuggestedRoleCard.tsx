import { ArrowUpRight } from "lucide-react";

export function SuggestedRoleCard({ role }: { role: string }) {
  return (
    <div className="group flex cursor-default items-center justify-between gap-2 rounded-control border border-line px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-2">
      <span className="truncate text-sm font-medium text-fg">{role}</span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
    </div>
  );
}
