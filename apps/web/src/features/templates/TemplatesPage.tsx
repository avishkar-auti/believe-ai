import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { createTemplate, deleteTemplate, duplicateTemplate, fetchTemplates } from "./templatesApi.js";

export function TemplatesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", body: "" });

  const { data, isLoading } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      setForm({ name: "", subject: "", body: "" });
      setShowForm(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Templates</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Reusable messages with {"{{firstName}}"}, {"{{company}}"} and more.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> New template
        </Button>
      </div>

      {showForm && (
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
      )}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6 text-brand-500" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState title="No templates yet." description="Create a template to reuse across campaigns." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <Card key={t.id}>
              <CardBody>
                <h3 className="font-medium text-ink-900 dark:text-white">{t.name}</h3>
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
          ))}
        </div>
      )}
    </div>
  );
}
