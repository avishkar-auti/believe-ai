import type { DesignProject } from "@believe-ai/shared";
import { ExternalLink } from "lucide-react";
import { CARD_H, CARD_W } from "./canvasLayout.js";
import { ProjectContextMenu } from "./ProjectContextMenu.js";
import { ProjectPreview } from "./ProjectPreview.js";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ProjectCard({
  project,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  project: DesignProject;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const previewHeight = Math.round((CARD_H / CARD_W) * 260);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
    >
      <div className="relative overflow-hidden border-b border-line" style={{ height: previewHeight }}>
        <div className="transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.02]">
          <ProjectPreview dsl={project.previewDsl} platform={project.previewPlatform} width={520} height={previewHeight} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-fg/0 opacity-0 transition-all duration-150 group-hover:bg-fg/30 group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-pill bg-white px-3.5 py-2 text-xs font-semibold text-fg shadow-lift">
            <ExternalLink className="h-3.5 w-3.5" /> Open project
          </span>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">{project.name}</h3>
          <p className="mt-0.5 text-xs text-fg-subtle">
            {project.screenCount} {project.screenCount === 1 ? "screen" : "screens"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-fg-subtle">
          <span className="hidden sm:inline">Edited {timeAgo(project.updatedAt)}</span>
          <ProjectContextMenu onOpen={onOpen} onRename={onRename} onDuplicate={onDuplicate} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}
