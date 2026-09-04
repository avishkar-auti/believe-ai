import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Save, Sparkles, X } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { createTemplate } from "./templatesApi.js";
import { chatAboutTemplate, type TemplateChatMessage } from "./templateChatApi.js";

const SUGGESTED_PROMPTS = [
  "Write a cold outreach template asking a recruiter about open roles",
  "Draft a short, polite follow-up for no response after a week",
  "Write a referral request template for a former colleague",
];

interface TemplateChatProps {
  onClose: () => void;
}

export function TemplateChat({ onClose }: TemplateChatProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<TemplateChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const chatMutation = useMutation({
    mutationFn: ({ text, history }: { text: string; history: TemplateChatMessage[] }) =>
      chatAboutTemplate(text, history, draft?.subject ?? null, draft?.body ?? null),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.subject.trim() || data.body.trim()) setDraft({ subject: data.subject, body: data.body });
      setChatError(null);
    },
    onError: () => setChatError("Couldn't reach the assistant — try again in a moment."),
  });

  const saveMutation = useMutation({
    mutationFn: () => createTemplate({ name: templateName, subject: draft!.subject, body: draft!.body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      setSavedMessage("Saved as a template — believe it!");
    },
  });

  function handleSend(overrideText?: string) {
    const text = (overrideText ?? question).trim();
    if (!text || chatMutation.isPending) return;
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setQuestion("");
    setSavedMessage(null);
    chatMutation.mutate({ text, history });
  }

  return (
    <Card className="overflow-hidden rounded-panel">
      <CardBody className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Chat column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-fg">
              <span className="flex h-6 w-6 items-center justify-center rounded-control bg-accent-soft text-accent">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              Draft a template with AI
            </p>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex max-h-80 min-h-[10rem] flex-col gap-2.5 overflow-y-auto rounded-control border border-line bg-surface-2 p-3">
            {messages.length === 0 ? (
              <div className="space-y-2.5 py-1">
                <p className="text-sm text-fg-muted">Tell it what kind of template you need, or start from a suggestion:</p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSend(p)}
                      disabled={chatMutation.isPending}
                      className="rounded-control border border-line bg-surface px-2.5 py-2 text-left text-xs text-fg-muted transition-colors hover:border-accent/40 hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-accent px-3 py-2 text-sm text-accent-fg"
                      : "max-w-[90%] rounded-2xl bg-surface px-3 py-2 text-sm text-fg-muted shadow-sm"
                  }
                >
                  {m.content}
                </div>
              ))
            )}
            {chatMutation.isPending && (
              <div className="flex items-center gap-2 text-xs text-fg-subtle">
                <Spinner className="h-3.5 w-3.5" /> Thinking&hellip;
              </div>
            )}
          </div>

          {chatError && <p className="text-xs text-critical">{chatError}</p>}

          <div className="flex items-center gap-2">
            <input
              className="h-10 flex-1 rounded-pill border border-line bg-surface px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-accent"
              placeholder="e.g. make it shorter, add a PS line…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!question.trim() || chatMutation.isPending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {chatMutation.isPending ? <Spinner className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Live draft column */}
        <div className="flex flex-col gap-3 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          {!draft ? (
            <div className="flex flex-1 flex-col gap-3 opacity-50">
              {/* A dimmed preview of the form that appears once a draft exists, so
                  the empty state shows real structure instead of a blank box. */}
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Live draft</p>
              <div className="h-10 rounded-control border border-line bg-surface-2" />
              <div className="h-32 rounded-control border border-line bg-surface-2" />
              <p className="text-center text-sm text-fg-subtle">
                Your draft will appear here as you chat &mdash; subject and body update live with each reply.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Live draft</p>
              <Input value={draft.subject} onChange={(e) => setDraft((d) => (d ? { ...d, subject: e.target.value } : d))} />
              <Textarea rows={8} value={draft.body} onChange={(e) => setDraft((d) => (d ? { ...d, body: e.target.value } : d))} />
              <div className="flex gap-2 pt-1">
                <Input placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                <Button onClick={() => saveMutation.mutate()} disabled={!templateName || saveMutation.isPending}>
                  <Save className="h-4 w-4" /> {saveMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
              {savedMessage && <p className="text-sm text-positive">{savedMessage}</p>}
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
