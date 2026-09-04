import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, ChevronDown, ChevronUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import type { Certification, CreateCertificationInput } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { Modal } from "../../../components/ui/Modal.js";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.js";
import { EmptyState } from "../../../components/ui/EmptyState.js";
import { Skeleton } from "../../../components/ui/Skeleton.js";
import { toast } from "../../../components/ui/Toast.js";
import {
  createCertification,
  deleteCertification,
  fetchCertifications,
  reorderCertifications,
  updateCertification,
} from "../api/certificationsApi.js";

function emptyForm(): CreateCertificationInput {
  return { name: "", issuingOrg: "", issueDate: "", expirationDate: "", credentialId: "", credentialUrl: "" };
}

export function CertificationsSection() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCertificationInput>(emptyForm());
  const [pendingDelete, setPendingDelete] = useState<Certification | null>(null);

  const { data: items, isLoading } = useQuery({ queryKey: ["profile", "certifications"], queryFn: fetchCertifications });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["profile", "certifications"] });
  }

  const createMutation = useMutation({
    mutationFn: () => createCertification(form),
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      toast("Certification added");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => updateCertification(id, form),
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      toast("Certification updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCertification(id),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
      toast("Certification removed");
    },
  });

  const reorderMutation = useMutation({ mutationFn: reorderCertifications, onSuccess: invalidate });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }

  function openEdit(cert: Certification) {
    setEditingId(cert.id);
    setForm({
      name: cert.name,
      issuingOrg: cert.issuingOrg,
      issueDate: cert.issueDate ?? "",
      expirationDate: cert.expirationDate ?? "",
      credentialId: cert.credentialId ?? "",
      credentialUrl: cert.credentialUrl ?? "",
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
        <h2 className="text-h3 text-fg">Certifications</h2>
        <Button size="sm" variant="secondary" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-16 rounded-xl" />
        ) : !items || items.length === 0 ? (
          <EmptyState icon={<Award className="h-5 w-5" />} title="No certifications yet" description="Add certifications you've earned." />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((cert, index) => (
              <li key={cert.id} className="group flex gap-3 py-4 first:pt-0 last:pb-0">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Award className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-fg">{cert.name}</p>
                  <p className="text-sm text-fg-muted">
                    {cert.issuingOrg}
                    {cert.issueDate && ` · Issued ${cert.issueDate}`}
                  </p>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-caption text-accent hover:underline"
                    >
                      View credential <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
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
                    onClick={() => openEdit(cert)}
                    className="rounded-control p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => setPendingDelete(cert)}
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
        title={editingId ? "Edit certification" : "Add certification"}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => (editingId ? updateMutation.mutate(editingId) : createMutation.mutate())}
              disabled={saving || !form.name.trim() || !form.issuingOrg.trim()}
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
            <span className="text-label text-fg-muted">Certification name</span>
            <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Issuing organization</span>
            <Input className="mt-1" value={form.issuingOrg} onChange={(e) => setForm((f) => ({ ...f, issuingOrg: e.target.value }))} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-label text-fg-muted">Issue date</span>
              <Input
                className="mt-1"
                type="month"
                value={form.issueDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-label text-fg-muted">Expiration (optional)</span>
              <Input
                className="mt-1"
                type="month"
                value={form.expirationDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, expirationDate: e.target.value }))}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-label text-fg-muted">Credential ID (optional)</span>
            <Input className="mt-1" value={form.credentialId ?? ""} onChange={(e) => setForm((f) => ({ ...f, credentialId: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-label text-fg-muted">Credential URL (optional)</span>
            <Input
              className="mt-1"
              value={form.credentialUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, credentialUrl: e.target.value }))}
            />
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove this certification?"
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
