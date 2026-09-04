import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DesignPlatform, DesignProject } from "@believe-ai/shared";
import { Skeleton } from "../../components/ui/Skeleton.js";
import {
  createDesignProject,
  createDesignScreen,
  deleteDesignProject,
  duplicateDesignProject,
  fetchDesignProjects,
  renameDesignProject,
} from "./designApi.js";
import { AIPromptComposer } from "./AIPromptComposer.js";
import { EmptyProjectsState } from "./EmptyProjectsState.js";
import { GenerationOverlay } from "./GenerationOverlay.js";
import { ProjectGrid } from "./ProjectGrid.js";
import { ProjectToolbar, type PlatformFilter, type ProjectSort, type ProjectView } from "./ProjectToolbar.js";
import { QuickStartIdeas } from "./QuickStartIdeas.js";
import { RenameProjectDialog } from "./RenameProjectDialog.js";
import { StudioHeader } from "./StudioHeader.js";
import { StudioHero } from "./StudioHero.js";
import { StudioSearchPalette } from "./StudioSearchPalette.js";
import { TemplateSection } from "./TemplateSection.js";
import { FloatingNotesLayer } from "../floating-notes/FloatingNotesLayer.js";

/** The studio entry point: an AI creation launcher, not a dashboard. One large
 * prompt creates a project and its first screen, then hands straight over to the
 * canvas. Existing work sits below as a real, searchable project browser. */
export function DesignProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<DesignPlatform>("web");
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DesignProject | null>(null);
  const [sort, setSort] = useState<ProjectSort>("updated");
  const [view, setView] = useState<ProjectView>("grid");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const projectsQuery = useQuery({ queryKey: ["design-projects"], queryFn: fetchDesignProjects });

  const createMutation = useMutation({
    mutationFn: async (vars: { prompt: string | null; platform: DesignPlatform }) => {
      const name = vars.prompt ? vars.prompt.slice(0, 48) : "Untitled design";
      const project = await createDesignProject({ name });
      if (vars.prompt) {
        // Kick off the first generation so the canvas opens already building.
        void createDesignScreen(project.id, { prompt: vars.prompt, platform: vars.platform }).catch(() => undefined);
      }
      return project;
    },
    onSuccess: (project) => navigate(`/app/design-studio/${project.id}`),
    onError: () => setError("Couldn't start a new project — please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDesignProject,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["design-projects"] }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameDesignProject(id, { name }),
    onSuccess: () => {
      setRenameTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["design-projects"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateDesignProject,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["design-projects"] }),
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSubmit() {
    const text = prompt.trim();
    if (!text || createMutation.isPending) return;
    createMutation.mutate({ prompt: text, platform });
  }

  function handleSelectIdea(text: string) {
    setPrompt(text);
    promptRef.current?.focus();
  }

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const visible = useMemo(() => {
    const filtered = platformFilter === "all" ? projects : projects.filter((p) => p.previewPlatform === platformFilter);
    const sorted = [...filtered];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sorted;
  }, [projects, platformFilter, sort]);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <StudioHeader onOpenSearch={() => setSearchOpen(true)} />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-20 pt-12 sm:px-6">
        <StudioHero />

        <div className="relative mx-auto mt-7 max-w-2xl">
          <AIPromptComposer
            value={prompt}
            onChange={setPrompt}
            platform={platform}
            onPlatformChange={setPlatform}
            onSubmit={handleSubmit}
            submitting={createMutation.isPending}
            onOpenBlankCanvas={() => createMutation.mutate({ prompt: null, platform })}
            promptRef={promptRef}
          />
          <GenerationOverlay active={createMutation.isPending} />
        </div>
        {error && <p className="mx-auto mt-2 max-w-2xl px-1 text-xs text-critical">{error}</p>}

        <div className="mx-auto max-w-2xl">
          <QuickStartIdeas onSelect={handleSelectIdea} />
        </div>

        <section className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-h3 text-fg">Recent projects</h2>
            <ProjectToolbar
              onOpenSearch={() => setSearchOpen(true)}
              sort={sort}
              onSortChange={setSort}
              view={view}
              onViewChange={setView}
              platformFilter={platformFilter}
              onPlatformFilterChange={setPlatformFilter}
            />
          </div>

          {projectsQuery.isLoading ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-4">
              <EmptyProjectsState onCreateWithAI={() => promptRef.current?.focus()} onOpenBlankCanvas={() => createMutation.mutate({ prompt: null, platform })} />
            </div>
          ) : visible.length === 0 ? (
            <p className="mt-6 text-xs text-fg-subtle">No projects match this filter.</p>
          ) : (
            <ProjectGrid
              projects={visible}
              view={view}
              onOpen={(id) => navigate(`/app/design-studio/${id}`)}
              onRename={setRenameTarget}
              onDuplicate={(id) => duplicateMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
              onNewProject={() => createMutation.mutate({ prompt: null, platform })}
            />
          )}
        </section>

        <TemplateSection onSelect={handleSelectIdea} />
      </main>

      <StudioSearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} projects={projects} onSelectIdea={handleSelectIdea} />

      {renameTarget && (
        <RenameProjectDialog
          open={Boolean(renameTarget)}
          currentName={renameTarget.name}
          onClose={() => setRenameTarget(null)}
          onSave={(name) => renameMutation.mutate({ id: renameTarget.id, name })}
          saving={renameMutation.isPending}
        />
      )}

      {/* This page also runs outside DashboardLayout — see DesignStudioPage's
          router comment — so it needs its own mount too. */}
      <FloatingNotesLayer />
    </div>
  );
}
