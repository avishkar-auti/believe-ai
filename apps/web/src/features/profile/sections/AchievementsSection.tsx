import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Trophy } from "lucide-react";
import { ACHIEVEMENT_CATEGORIES, type Achievement, type AchievementCategory, type CreateAchievementInput } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { Textarea } from "../../../components/ui/Textarea.js";
import { Select } from "../../../components/ui/Select.js";
import { Modal } from "../../../components/ui/Modal.js";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.js";
import { EmptyState } from "../../../components/ui/EmptyState.js";
import { Skeleton } from "../../../components/ui/Skeleton.js";
import { Badge } from "../../../components/ui/Badge.js";
import { toast } from "../../../components/ui/Toast.js";
import {
  createAchievement,
  deleteAchievement,
  fetchAchievements,
  reorderAchievements,
  updateAchievement,
} from "../api/achievementsApi.js";

function emptyForm(): CreateAchievementInput {
  return { title: "", category: "Hackathon", description: "", date: "" };
}

export function AchievementsSection() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAchievementInput>(emptyForm());
  const [pendingDelete, setPendingDelete] = useState<Achievement | null>(null);

  const { data: items, isLoading } = useQuery({ queryKey: ["profile", "achievements"], queryFn: fetchAchievements });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["profile", "achievements"] });
  }

  const createMutation = useMutation({
    mutationFn: () => createAchievement(form),
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      toast("Achievement added");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => updateAchievement(id, form),
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      toast("Achievement updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAchievement(id),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
      toast("Achievement removed");
    },
  });

  const reorderMutation = useMutation({ mutationFn: reorderAchievements, onSuccess: invalidate });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }

  function openEdit(achievement: Achievement) {
    setEditingId(achievement.id);
    setForm({
      title: achievement.title,
      category: achievement.category,
      description: achievement.description ?? "",
      date: achievement.date ?? "",
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
        <h2 className="text-h3 text-fg">Achievements</h2>
        <Button size="sm" variant="secondary" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-16 rounded-xl" />
        ) : !items || items.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-5 w-5" />}
            title="No achievements yet"
            description="Hackathons, awards, publications, open source — showcase what you've done."
          />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((a, index) => (
              <li key={a.id} className="group flex gap-3 py-4 first:pt-0 last:pb-0">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Trophy className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-fg">{a.title}</p>
                    <Badge tone="accent">{a.category}</Badge>
                  </div>
                  {a.date && <p className="text-caption text-fg-subtle">{a.date}</p>}
                  {a.description && <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{a.description}</p>}
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
                    onClick={() => openEdit(a)}
                    className="rounded-control p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => setPendingDelete(a)}
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
        title={editingId ? "Edit achievement" : "Add achievement"}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => (editingId ? updateMutation.mutate(editingId) : createMutation.mutate())}
              disabled={saving || !form.title.trim()}
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
            <span className="text-label text-fg-muted">Title</span>
            <Input className="mt-1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Category</span>
            <Select
              className="mt-1"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AchievementCategory }))}
            >
              {ACHIEVEMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Date (optional)</span>
            <Input className="mt-1" type="month" value={form.date ?? ""} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
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
        title="Remove this achievement?"
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
