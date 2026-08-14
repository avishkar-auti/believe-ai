import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import type { AiImproveAction } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { generateEmail, improveEmail } from "./aiApi.js";
import { createTemplate } from "../templates/templatesApi.js";

const IMPROVE_ACTIONS: { action: AiImproveAction; label: string }[] = [
  { action: "make_shorter", label: "Make shorter" },
  { action: "make_professional", label: "More professional" },
  { action: "make_friendly", label: "More friendly" },
  { action: "make_persuasive", label: "More persuasive" },
  { action: "fix_grammar", label: "Fix grammar" },
  { action: "rewrite", label: "Rewrite" },
];

export function AiWriterPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ goal: "", target: "", tone: "Professional and friendly", context: "" });
  const [result, setResult] = useState<{ subject: string; body: string; cta?: string } | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: generateEmail,
    onSuccess: (data) => setResult(data),
  });

  const improveMutation = useMutation({
    mutationFn: ({ action }: { action: AiImproveAction }) =>
      improveEmail(result!.subject, result!.body, action),
    onSuccess: (data) => setResult((r) => (r ? { ...r, ...data } : data)),
  });

  const saveMutation = useMutation({
    mutationFn: () => createTemplate({ name: templateName, subject: result!.subject, body: result!.body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      setSavedMessage("Saved as a template — believe it!");
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSavedMessage(null);
    generateMutation.mutate({
      goal: form.goal,
      target: form.target,
      tone: form.tone,
      context: form.context || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
          <Sparkles className="h-5 w-5 text-brand-500" /> Believe AI Writer
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">Tell it your goal — you review and approve every word.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200">Goal</label>
              <Input
                placeholder="Ask a recruiter about software engineering opportunities"
                required
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              />
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200">Target</label>
              <Input
                placeholder="Senior recruiter at a technology company"
                required
                value={form.target}
                onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
              />
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200">Tone</label>
              <Input
                value={form.tone}
                onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
              />
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200">Context (optional)</label>
              <Textarea
                rows={4}
                placeholder="I am a final-year computer science student…"
                value={form.context}
                onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
              />
              <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? "Writing…" : "Generate email"}
              </Button>
              {generateMutation.isError && (
                <p className="text-sm text-red-600">Couldn't generate an email. Check your AI provider configuration.</p>
              )}
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            {!result ? (
              <p className="text-sm text-ink-500 dark:text-ink-400">Your generated email will appear here.</p>
            ) : (
              <>
                <Input
                  value={result.subject}
                  onChange={(e) => setResult((r) => (r ? { ...r, subject: e.target.value } : r))}
                />
                <Textarea
                  rows={10}
                  value={result.body}
                  onChange={(e) => setResult((r) => (r ? { ...r, body: e.target.value } : r))}
                />
                <div className="flex flex-wrap gap-2">
                  {IMPROVE_ACTIONS.map(({ action, label }) => (
                    <Button
                      key={action}
                      variant="secondary"
                      size="sm"
                      onClick={() => improveMutation.mutate({ action })}
                      disabled={improveMutation.isPending}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={!templateName || saveMutation.isPending}
                  >
                    Save as template
                  </Button>
                </div>
                {savedMessage && <p className="text-sm text-lime-600">{savedMessage}</p>}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
