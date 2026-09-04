import type { Resume } from "@believe-ai/shared";
import { ChevronDown, FileText } from "lucide-react";
import { Menu } from "../../components/ui/Menu.js";
import { Badge } from "../../components/ui/Badge.js";

export function ResumeSelector({
  resumes,
  selectedResumeId,
  onSelect,
}: {
  resumes: Resume[];
  selectedResumeId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const selected = resumes.find((r) => r.id === selectedResumeId);
  if (!selected) return null;

  // A single resume isn't worth a picker — just show what's being used.
  if (resumes.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-control border border-line bg-surface px-3.5 py-2.5">
        <FileText className="h-4 w-4 shrink-0 text-fg-subtle" />
        <span className="min-w-0 flex-1 truncate text-sm text-fg">{selected.targetRole ?? selected.fileName}</span>
        {selected.isPrimary && <Badge tone="accent">Primary</Badge>}
      </div>
    );
  }

  return (
    <Menu
      align="start"
      className="w-full"
      trigger={
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-control border border-line bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-line-strong"
        >
          <FileText className="h-4 w-4 shrink-0 text-fg-subtle" />
          <span className="min-w-0 flex-1 truncate text-sm text-fg">{selected.targetRole ?? selected.fileName}</span>
          {selected.isPrimary && <Badge tone="accent">Primary</Badge>}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
        </button>
      }
      items={resumes.map((r) => ({
        id: r.id,
        label: (r.targetRole ?? r.fileName) + (r.isPrimary ? " · Primary" : ""),
        icon: FileText,
        onSelect: () => onSelect(r.id),
      }))}
    />
  );
}
