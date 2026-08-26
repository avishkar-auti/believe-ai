import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, FileText, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { createTemplate, deleteTemplate, duplicateTemplate, fetchTemplates } from "./templatesApi.js";
import { TemplateChat } from "./TemplateChat.js";

type PanelMode = "closed" | "manual" | "chat";

export function TemplatesPage() {
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<PanelMode>("closed");
  const [form, setForm] = useState({ name: "", subject: "", body: "" });

  const { data, isLoading } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      setForm({ name: "", subject: "", body: "" });
      setPanel("closed");
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
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Templates</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Reusable messages with {"{{firstName}}"}, {"{{company}}"} and more.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setPanel((p) => (p === "chat" ? "closed" : "chat"))}
          >
            <Sparkles className="h-4 w-4" /> Draft with AI
          </Button>
          <Button onClick={() => setPanel((p) => (p === "manual" ? "closed" : "manual"))}>
            <Plus className="h-4 w-4" /> New template
          </Button>
        </div>
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
              <CardBody>
                <form className="space-y-3" onSubmit={handleSubmit}>
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
                  <Textarea
                    placeholder="Body — use {{firstName}}, {{lastName}}, {{company}}, {{jobTitle}}, {{senderName}}, {{senderCompany}}"
                    required
                    rows={8}
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  />
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving…" : "Save template"}
                  </Button>
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
          <Spinner className="h-6 w-6 text-brand-500" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState title="No templates yet." description="Create a template to reuse across campaigns." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
              whileHover={{ y: -5, scale: 1.015 }}
              className="group"
            >
              <Card className="h-full transition-shadow duration-300 group-hover:shadow-lift">
                <CardBody>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 transition-transform duration-300 group-hover:scale-110 dark:text-brand-300">
                    <FileText className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="mt-3 font-medium text-ink-900 dark:text-white">{t.name}</h3>
                  <p className="mt-1 text-sm font-medium text-ink-700 dark:text-ink-200">{t.subject}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-ink-500 dark:text-ink-400">{t.body}</p>
                  <div className="mt-3 flex gap-2">
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
