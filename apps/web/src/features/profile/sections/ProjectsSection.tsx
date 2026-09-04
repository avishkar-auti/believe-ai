import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ExternalLink, FolderGit2, Github, Pencil, Plus, Trash2 } from "lucide-react";
import type { CreatePortfolioProjectInput, PortfolioProject } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { Textarea } from "../../../components/ui/Textarea.js";
import { Modal } from "../../../components/ui/Modal.js";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.js";
import { EmptyState } from "../../../components/ui/EmptyState.js";
import { Skeleton } from "../../../components/ui/Skeleton.js";
import { toast } from "../../../components/ui/Toast.js";
import { createProject, deleteProject, fetchProjects, reorderProjects, updateProject } from "../api/projectsApi.js";

interface FormState extends Omit<CreatePortfolioProjectInput, "technologies"> {
  technologiesInput: string;
}

function emptyForm(): FormState {
  return { name: "", description: "", technologiesInput: "", githubUrl: "", liveUrl: "", startDate: "", endDate: "", isCurrent: false };
}

export function ProjectsSection() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [pendingDelete, setPendingDelete] = useState<PortfolioProject | null>(null);

  const { data: items, isLoading } = useQuery({ queryKey: ["profile", "projects"], queryFn: fetchProjects });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["profile", "projects"] });
  }

  function toInput(): CreatePortfolioProjectInput {
    const { technologiesInput, ...rest } = form;
    return {
      ...rest,
      technologies: technologiesInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }

  const createMutation = useMutation({
    mutationFn: () => createProject(toInput()),
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      toast("Project added");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => updateProject(id, toInput()),
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      toast("Project updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
      toast("Project removed");
    },
  });

  const reorderMutation = useMutation({ mutationFn: reorderProjects, onSuccess: invalidate });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }

  function openEdit(project: PortfolioProject) {
    setEditingId(project.id);
    setForm({
      name: project.name,
      description: project.description ?? "",
      technologiesInput: project.technologies.join(", "),
      githubUrl: project.githubUrl ?? "",
      liveUrl: project.liveUrl ?? "",
      startDate: project.startDate ?? "",
      endDate: project.endDate ?? "",
      isCurrent: project.isCurrent,
    });
    setDrawerOpen(true);
  }

  function move(index: number, direction: -1 | 1) {
    if (!items) return;
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    reorderMutation.mutate(next.map((i) => i.id));
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-h3 text-fg">Projects</h2>
        <Button size="sm" variant="secondary" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : !items || items.length === 0 ? (
          <EmptyState
            icon={<FolderGit2 className="h-5 w-5" />}
            title="No projects yet"
            description="Showcase your work and projects."
            action={
              <Button size="sm" onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add project
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((project, index) => (
              <div key={project.id} className="group relative rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-fg">{project.name}</p>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="rounded-control p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                      className="rounded-control p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Edit"
                      onClick={() => openEdit(project)}
                      className="rounded-control p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => setPendingDelete(project)}
                      className="rounded-control p-1 text-fg-subtle hover:bg-critical/10 hover:text-critical"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {project.description && <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{project.description}</p>}
                {project.technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.technologies.map((tech) => (
                      <span key={tech} className="rounded-pill bg-surface-2 px-2.5 py-1 text-xs font-medium text-fg-muted">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {(project.githubUrl || project.liveUrl) && (
                  <div className="mt-3 flex items-center gap-3 text-label text-fg-muted">
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">
                        <Github className="h-3.5 w-3.5" /> GitHub
                      </a>
                    )}
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">
                        <ExternalLink className="h-3.5 w-3.5" /> Live demo
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>

      <Modal
        open={drawerOpen}
        title={editingId ? "Edit project" : "Add project"}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => (editingId ? updateMutation.mutate(editingId) : createMutation.mutate())}
              disabled={saving || !form.name.trim()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-label text-fg-muted">Project name</span>
            <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Description</span>
            <Textarea
              className="mt-1"
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Technologies (comma-separated)</span>
            <Input
              className="mt-1"
              placeholder="Python, LangGraph, Gemini"
              value={form.technologiesInput}
              onChange={(e) => setForm((f) => ({ ...f, technologiesInput: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">GitHub URL</span>
            <Input className="mt-1" value={form.githubUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Live demo URL</span>
            <Input className="mt-1" value={form.liveUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, liveUrl: e.target.value }))} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-label text-fg-muted">Start</span>
              <Input
                className="mt-1"
                type="month"
                value={form.startDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-label text-fg-muted">End</span>
              <Input
                className="mt-1"
                type="month"
                disabled={form.isCurrent}
                value={form.endDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-label text-fg-muted">
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent"
              checked={form.isCurrent}
              onChange={(e) => setForm((f) => ({ ...f, isCurrent: e.target.checked, endDate: e.target.checked ? "" : f.endDate }))}
            />
            Currently working on this
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove this project?"
        description="This can't be undone."
        confirmLabel="Remove"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </Card>
  );
}
