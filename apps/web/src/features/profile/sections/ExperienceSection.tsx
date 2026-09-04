import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import type { CreateExperienceInput, Experience, ExperienceEmploymentType } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { Textarea } from "../../../components/ui/Textarea.js";
import { Select } from "../../../components/ui/Select.js";
import { Modal } from "../../../components/ui/Modal.js";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.js";
import { EmptyState } from "../../../components/ui/EmptyState.js";
import { Skeleton } from "../../../components/ui/Skeleton.js";
import { toast } from "../../../components/ui/Toast.js";
import {
  createExperience,
  deleteExperience,
  fetchExperience,
  reorderExperience,
  updateExperience,
} from "../api/experienceApi.js";

const EMPLOYMENT_TYPES: ExperienceEmploymentType[] = [
  "Full-time",
  "Part-time",
  "Internship",
  "Contract",
  "Freelance",
  "Self-employed",
];

function emptyForm(): CreateExperienceInput {
  return {
    title: "",
    company: "",
    employmentType: "Full-time",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  };
}

function formatRange(exp: Experience) {
  const start = exp.startDate || "—";
  const end = exp.isCurrent ? "Present" : exp.endDate || "—";
  return `${start} – ${end}`;
}

export function ExperienceSection() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateExperienceInput>(emptyForm());
  const [pendingDelete, setPendingDelete] = useState<Experience | null>(null);

  const { data: items, isLoading } = useQuery({ queryKey: ["profile", "experience"], queryFn: fetchExperience });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["profile", "experience"] });
  }

  const createMutation = useMutation({
    mutationFn: () => createExperience(form),
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      toast("Experience added");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => updateExperience(id, form),
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      toast("Experience updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExperience(id),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
      toast("Experience removed");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderExperience,
    onSuccess: invalidate,
  });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }

  function openEdit(exp: Experience) {
    setEditingId(exp.id);
    setForm({
      title: exp.title,
      company: exp.company,
      employmentType: exp.employmentType,
      location: exp.location ?? "",
      startDate: exp.startDate ?? "",
      endDate: exp.endDate ?? "",
      isCurrent: exp.isCurrent,
      description: exp.description ?? "",
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
        <h2 className="text-h3 text-fg">Experience</h2>
        <Button size="sm" variant="secondary" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : !items || items.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title="No experience added yet"
            description="Tell recruiters where you've worked."
            action={
              <Button size="sm" onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add experience
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((exp, index) => (
              <li key={exp.id} className="group flex gap-3 py-4 first:pt-0 last:pb-0">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Briefcase className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-medium text-fg">{exp.title}</p>
                    <span className="text-caption text-fg-subtle">{formatRange(exp)}</span>
                  </div>
                  <p className="text-sm text-fg-muted">
                    {exp.company} · {exp.employmentType}
                  </p>
                  {exp.location && <p className="text-caption text-fg-subtle">{exp.location}</p>}
                  {exp.description && <p className="mt-2 text-sm leading-relaxed text-fg-muted">{exp.description}</p>}
                </div>
                <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded-control p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded-control p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => openEdit(exp)}
                    className="rounded-control p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => setPendingDelete(exp)}
                    className="rounded-control p-1.5 text-fg-subtle hover:bg-critical/10 hover:text-critical"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Modal
        open={drawerOpen}
        title={editingId ? "Edit experience" : "Add experience"}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => (editingId ? updateMutation.mutate(editingId) : createMutation.mutate())}
              disabled={saving || !form.title.trim() || !form.company.trim()}
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
            <span className="text-label text-fg-muted">Job title</span>
            <Input className="mt-1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Company</span>
            <Input className="mt-1" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Employment type</span>
            <Select
              className="mt-1"
              value={form.employmentType}
              onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as ExperienceEmploymentType }))}
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Location</span>
            <Input className="mt-1" value={form.location ?? ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
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
            I currently work here
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Description</span>
            <Textarea
              className="mt-1"
              rows={4}
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove this experience?"
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
