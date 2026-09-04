import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import type { CreateEducationInput, Education } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { Textarea } from "../../../components/ui/Textarea.js";
import { Modal } from "../../../components/ui/Modal.js";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.js";
import { EmptyState } from "../../../components/ui/EmptyState.js";
import { Skeleton } from "../../../components/ui/Skeleton.js";
import { toast } from "../../../components/ui/Toast.js";
import { createEducation, deleteEducation, fetchEducation, reorderEducation, updateEducation } from "../api/educationApi.js";

function emptyForm(): CreateEducationInput {
  return { school: "", degree: "", fieldOfStudy: "", startYear: null, endYear: null, grade: "", description: "" };
}

function formatRange(edu: Education) {
  if (!edu.startYear && !edu.endYear) return null;
  return `${edu.startYear ?? "—"} – ${edu.endYear ?? "Present"}`;
}

export function EducationSection() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateEducationInput>(emptyForm());
  const [pendingDelete, setPendingDelete] = useState<Education | null>(null);

  const { data: items, isLoading } = useQuery({ queryKey: ["profile", "education"], queryFn: fetchEducation });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["profile", "education"] });
  }

  const createMutation = useMutation({
    mutationFn: () => createEducation(form),
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      toast("Education added");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => updateEducation(id, form),
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      toast("Education updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEducation(id),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
      toast("Education removed");
    },
  });

  const reorderMutation = useMutation({ mutationFn: reorderEducation, onSuccess: invalidate });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }

  function openEdit(edu: Education) {
    setEditingId(edu.id);
    setForm({
      school: edu.school,
      degree: edu.degree ?? "",
      fieldOfStudy: edu.fieldOfStudy ?? "",
      startYear: edu.startYear,
      endYear: edu.endYear,
      grade: edu.grade ?? "",
      description: edu.description ?? "",
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
        <h2 className="text-h3 text-fg">Education</h2>
        <Button size="sm" variant="secondary" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : !items || items.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-5 w-5" />}
            title="No education added yet"
            description="Add your degrees and certifications."
            action={
              <Button size="sm" onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add education
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((edu, index) => (
              <li key={edu.id} className="group flex gap-3 py-4 first:pt-0 last:pb-0">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <GraduationCap className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-medium text-fg">{edu.school}</p>
                    {formatRange(edu) && <span className="text-caption text-fg-subtle">{formatRange(edu)}</span>}
                  </div>
                  {(edu.degree || edu.fieldOfStudy) && (
                    <p className="text-sm text-fg-muted">{[edu.degree, edu.fieldOfStudy].filter(Boolean).join(", ")}</p>
                  )}
                  {edu.grade && <p className="text-caption text-fg-subtle">Grade: {edu.grade}</p>}
                  {edu.description && <p className="mt-2 text-sm leading-relaxed text-fg-muted">{edu.description}</p>}
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
                    onClick={() => openEdit(edu)}
                    className="rounded-control p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => setPendingDelete(edu)}
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
        title={editingId ? "Edit education" : "Add education"}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => (editingId ? updateMutation.mutate(editingId) : createMutation.mutate())}
              disabled={saving || !form.school.trim()}
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
            <span className="text-label text-fg-muted">School / University</span>
            <Input className="mt-1" value={form.school} onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Degree</span>
            <Input className="mt-1" value={form.degree ?? ""} onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Field of study</span>
            <Input
              className="mt-1"
              value={form.fieldOfStudy ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fieldOfStudy: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-label text-fg-muted">Start year</span>
              <Input
                className="mt-1"
                type="number"
                value={form.startYear ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, startYear: e.target.value ? Number(e.target.value) : null }))}
              />
            </label>
            <label className="block">
              <span className="text-label text-fg-muted">End year</span>
              <Input
                className="mt-1"
                type="number"
                value={form.endYear ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, endYear: e.target.value ? Number(e.target.value) : null }))}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-label text-fg-muted">Grade (optional)</span>
            <Input className="mt-1" value={form.grade ?? ""} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} />
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
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove this education entry?"
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
