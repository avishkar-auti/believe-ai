import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, FileText, Pencil, PenLine, Plus, Sparkles, Trash2 } from "lucide-react";
import type { Template } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { MOTION } from "../../lib/motion.js";
import { createTemplate, deleteTemplate, duplicateTemplate, fetchTemplates, updateTemplate } from "./templatesApi.js";
import { TemplateChat } from "./TemplateChat.js";
import { EmailBodyEditor } from "./EmailBodyEditor.js";

type PanelMode = "closed" | "manual" | "chat";

const SIGNATURE_HTML = "<p>Best regards,<br>{{senderName}}<br>{{linkedin}} | {{github}}</p>";

export function TemplatesPage() {
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<PanelMode>("closed");
  const [form, setForm] = useState({ name: "", subject: "", body: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  function openCreate() {
    setForm({ name: "", subject: "", body: "" });
    setEditingId(null);
    setPanel("manual");
  }

  function openEdit(t: Template) {
    setForm({ name: t.name, subject: t.subject, body: t.bodyHtml });
    setEditingId(t.id);
    setPanel("manual");
  }

  function closePanel() {
    setPanel("closed");
    setEditingId(null);
  }

  function appendSignature() {
    setForm((f) => ({ ...f, body: f.body + SIGNATURE_HTML }));
  }

  const { data, isLoading } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });

  const createMutation = useMutation({
    mutationFn: () => createTemplate({ name: form.name, subject: form.subject, body: form.body, bodyFormat: "html" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      setForm({ name: "", subject: "", body: "" });
      setPanel("closed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => updateTemplate(id, { name: form.name, subject: form.subject, body: form.body, bodyFormat: "html" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      closePanel();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateTemplate,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(editingId);
    } else {
      createMutation.mutate();
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: MOTION.slow, ease: "easeOut" }}>
        <PageHeader
          eyebrow="Outreach"
          title="Templates"
          description={
            <>
              Reusable messages with {"{{firstName}}"}, {"{{company}}"}, and your own {"{{linkedin}}"} / {"{{github}}"}.
            </>
          }
          actions={
            <>
              <Button variant="secondary" onClick={() => setPanel((p) => (p === "chat" ? "closed" : "chat"))}>
                <Sparkles className="h-4 w-4" /> Draft with AI
              </Button>
              <Button onClick={() => (panel === "manual" && editingId === null ? closePanel() : openCreate())}>
                <Plus className="h-4 w-4" /> New template
              </Button>
            </>
          }
        />
      </motion.div>

      <AnimatePresence>
        {panel === "manual" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <Card>
              <CardBody className="space-y-3">
                <form className="space-y-3" onSubmit={handleSubmit}>
                  <p className="text-sm font-medium text-fg">{editingId ? "Edit template" : "New template"}</p>
                  <Input
                    placeholder="Template name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Subject — e.g. Quick question, {{firstName}}"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={appendSignature}
                      className="inline-flex items-center gap-1 rounded-pill border border-dashed border-line-strong px-2.5 py-1 text-xs font-medium text-fg-muted hover:border-accent hover:text-accent"
                    >
                      <PenLine className="h-3 w-3" /> Add sign-off
                    </button>
                  </div>
                  <EmailBodyEditor subject={form.subject} value={form.body} onChange={(body) => setForm((f) => ({ ...f, body }))} />
                  <div className="flex items-center gap-2">
                    <Button type="submit" disabled={isSaving || !form.body.trim()}>
                      {isSaving ? "Saving…" : editingId ? "Save changes" : "Save template"}
                    </Button>
                    {editingId && (
                      <Button type="button" variant="ghost" onClick={closePanel}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {panel === "chat" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <TemplateChat onClose={() => setPanel("closed")} />
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6 text-accent" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-start rounded-card border border-line bg-surface p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-control bg-accent-soft text-accent">
            <FileText className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-h2 text-fg">No templates yet</h2>
          <p className="mt-1.5 max-w-sm text-label text-fg-muted">
            Create one manually, or let Believe AI draft the first version from a one-line brief.
          </p>
          <div className="mt-5 flex gap-2">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> New template
            </Button>
            <Button variant="secondary" onClick={() => setPanel("chat")}>
              <Sparkles className="h-4 w-4" /> Draft with AI
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
              className="group"
            >
              <Card className="h-full transition-colors duration-150 group-hover:border-line-strong">
                <CardBody>
                  <span className="flex h-9 w-9 items-center justify-center rounded-control bg-accent-soft text-accent">
                    <FileText className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="mt-3 font-medium text-fg">{t.name}</h3>
                  <p className="mt-1 text-sm font-medium text-fg-muted">{t.subject}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-fg-subtle">{t.bodyText}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicateMutation.mutate(t.id)}>
                      <Copy className="h-4 w-4" /> Duplicate
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(t.id)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
