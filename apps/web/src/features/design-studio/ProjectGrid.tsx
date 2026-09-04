import type { DesignProject } from "@believe-ai/shared";
import { ExternalLink } from "lucide-react";
import { NewProjectCard } from "./NewProjectCard.js";
import { ProjectCard } from "./ProjectCard.js";
import { ProjectContextMenu } from "./ProjectContextMenu.js";
import { ProjectPreview } from "./ProjectPreview.js";
import type { ProjectView } from "./ProjectToolbar.js";

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

interface ProjectGridProps {
  projects: DesignProject[];
  view: ProjectView;
  onOpen: (id: string) => void;
  onRename: (project: DesignProject) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onNewProject: () => void;
}

export function ProjectGrid({ projects, view, onOpen, onRename, onDuplicate, onDelete, onNewProject }: ProjectGridProps) {
  if (view === "list") {
    return (
      <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {projects.map((project) => (
          <div
            key={project.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(project.id)}
            onKeyDown={(e) => e.key === "Enter" && onOpen(project.id)}
            className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-surface-2"
          >
            <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-line">
              <ProjectPreview dsl={project.previewDsl} platform={project.previewPlatform} width={128} height={80} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{project.name}</p>
              <p className="text-xs text-fg-subtle">
                {project.screenCount} {project.screenCount === 1 ? "screen" : "screens"} · Edited {timeAgo(project.updatedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(project.id);
              }}
              className="hidden shrink-0 items-center gap-1.5 rounded-pill border border-line px-2.5 py-1 text-xs font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg sm:flex"
            >
              <ExternalLink className="h-3 w-3" /> Open
            </button>
            <ProjectContextMenu
              onOpen={() => onOpen(project.id)}
              onRename={() => onRename(project)}
              onDuplicate={() => onDuplicate(project.id)}
              onDelete={() => onDelete(project.id)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={() => onOpen(project.id)}
          onRename={() => onRename(project)}
          onDuplicate={() => onDuplicate(project.id)}
          onDelete={() => onDelete(project.id)}
        />
      ))}
      <NewProjectCard onClick={onNewProject} />
    </div>
  );
}
