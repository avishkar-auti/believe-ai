import { Lock } from "lucide-react";
import type { ChallengeStarterFile } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";

export function FileExplorer({
  files,
  activePath,
  onSelect,
}: {
  files: ChallengeStarterFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
}) {
  return (
    <div role="tablist" aria-label="Files" className="flex items-center gap-1 overflow-x-auto border-b border-line bg-surface-2 px-2">
      {files.map((file) => {
        const active = file.path === activePath;
        return (
          <button
            key={file.path}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(file.path)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-xs transition-colors",
              active ? "border-accent text-fg" : "border-transparent text-fg-subtle hover:text-fg",
            )}
          >
            {file.path}
            {file.readOnly && <Lock className="h-3 w-3" aria-label="Read-only" />}
          </button>
        );
      })}
    </div>
  );
}
