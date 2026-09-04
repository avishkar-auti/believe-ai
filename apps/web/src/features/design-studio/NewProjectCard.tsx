import { Plus } from "lucide-react";

export function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-[13rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-transparent p-4 text-center transition-colors duration-150 hover:border-accent hover:bg-accent-soft"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-surface-2 text-fg-muted transition-all duration-150 group-hover:scale-110 group-hover:rotate-90 group-hover:bg-accent group-hover:text-accent-fg">
        <Plus className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold text-fg">New project</span>
      <span className="text-xs text-fg-subtle">Start from prompt or canvas</span>
    </button>
  );
}
