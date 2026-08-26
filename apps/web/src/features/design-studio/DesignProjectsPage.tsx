import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutTemplate, Plus, Search, Trash2 } from "lucide-react";
import type { DesignProject } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { createDesignProject, deleteDesignProject, fetchDesignProjects } from "./designApi.js";
import { groupProjectsByDate } from "./projectGroups.js";

export function DesignProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const projectsQuery = useQuery({ queryKey: ["design-projects"], queryFn: fetchDesignProjects });

  const createMutation = useMutation({
    mutationFn: () => createDesignProject({}),
    onSuccess: (project) => navigate(`/app/design-studio/${project.id}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDesignProject,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["design-projects"] }),
  });

  const projects = projectsQuery.data ?? [];
  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : projects;
  const groups = groupProjectsByDate(filtered);

  return (
    <div className="mx-auto max-w-content space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-200/80 pb-5 dark:border-ink-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400 dark:text-ink-500">
            AI Design &amp; Prototyping
          </p>
          <h1 className="text-title font-semibold text-ink-900 dark:text-white">Design Studio</h1>
        </div>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          <Plus className="h-4 w-4" />
          {createMutation.isPending ? "Creating…" : "New Design"}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="h-11 w-full rounded-pill border border-ink-200 bg-white pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50 dark:focus:border-ink-300"
        />
      </div>

      {projectsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-ink-400" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="h-6 w-6 text-ink-400" />}
          title="No designs yet"
          description="Click New Design to generate your first screen."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="No projects match your search." />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
                {group.label}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={() => navigate(`/app/design-studio/${project.id}`)}
                    onDelete={() => deleteMutation.mutate(project.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onOpen, onDelete }: { project: DesignProject; onOpen: () => void; onDelete: () => void }) {
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500/40"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Delete project"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink-300 opacity-0 transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 group-hover:opacity-100 dark:text-ink-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
        <LayoutTemplate className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-ink-900 dark:text-white">{project.name}</h3>
        <p className="text-xs text-ink-400 dark:text-ink-500">
          {project.screenCount} {project.screenCount === 1 ? "screen" : "screens"}
        </p>
      </div>
    </div>
  );
}
