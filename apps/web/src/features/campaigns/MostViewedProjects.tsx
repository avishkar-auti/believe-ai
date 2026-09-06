import { Boxes } from "lucide-react";
import type { ProjectEngagement } from "@believe-ai/shared";
import { Badge } from "../../components/ui/Badge.js";

/** Only ever shows a project that matched one of the student's own
 * PortfolioProject entries by URL (see campaign_service.py::get_top_projects)
 * — a generic "Project" link that isn't one of their listed projects simply
 * doesn't appear here rather than being guessed at. */
export function MostViewedProjects({ projects }: { projects: ProjectEngagement[] }) {
  if (projects.length === 0) return null;

  return (
    <ul className="divide-y divide-ink-100 text-sm dark:divide-ink-800">
      {projects.map((project) => (
        <li key={project.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
              <Boxes className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-800 dark:text-ink-100">{project.name}</p>
              {project.description && <p className="truncate text-xs text-ink-400">{project.description}</p>}
            </div>
          </div>
          <Badge tone="accent" className="shrink-0">
            {project.clickCount}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
