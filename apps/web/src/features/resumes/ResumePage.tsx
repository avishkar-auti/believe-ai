import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  FileText,
  GraduationCap,
  ListChecks,
  Map,
  MessageCircle,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { SiriOrb } from "../../components/ui/SiriOrb.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { askResume, deleteResume, fetchResume, uploadResume, type ResumeChatMessage } from "./resumeApi.js";

const SUGGESTED_PROMPTS = [
  "What's my most recent role?",
  "What's my strongest skill?",
  "Summarize my experience in two sentences",
];

export function ResumePage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ResumeChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  const { data: resume, isLoading } = useQuery({ queryKey: ["resume"], queryFn: fetchResume });

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: (data) => {
      queryClient.setQueryData(["resume"], data);
      setMessages([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      queryClient.setQueryData(["resume"], null);
      setMessages([]);
    },
  });

  const chatMutation = useMutation({
    mutationFn: ({ text, history }: { text: string; history: ResumeChatMessage[] }) => askResume(text, history),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      setQuestion("");
      setChatError(null);
    },
    onError: () => setChatError("Couldn't get an answer — try again in a moment."),
  });

  function handleAsk(overrideText?: string) {
    const text = (overrideText ?? question).trim();
    if (!text || chatMutation.isPending) return;
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    chatMutation.mutate({ text, history });
  }

  const firstName = user?.name?.trim().split(/\s+/)[0];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6 text-ink-400" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
            <MessageCircle className="h-5 w-5 text-brand-500" /> Ask My Resume
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Upload your resume once, then ask it questions — answers are grounded in what it actually says.
          </p>
        </div>
        <Card>
          <CardBody>
            <EmptyState
              title="No resume uploaded yet"
              description="PDF only, up to 4 MB. We extract the text and never store anything you didn't upload."
              action={
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
                  />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? "Uploading…" : "Choose a PDF"}
                  </Button>
                  {uploadMutation.isError && (
                    <p className="mt-2 text-sm text-red-600">Couldn't read that PDF — try another file.</p>
                  )}
                </div>
              }
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:h-[calc(100vh-8rem)] lg:grid-cols-4">
      {/* Resume context rail — real file data only */}
      <Card className="flex flex-col lg:col-span-1 lg:overflow-y-auto">
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink-900 dark:text-white">
              <FileText className="h-4 w-4 shrink-0 text-ink-400" />
              <span className="truncate">{resume.fileName}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Badge tone={resume.embeddingReady ? "success" : "warning"}>
            {resume.embeddingReady ? "Ready for chat" : "Processing…"}
          </Badge>
          <p className="text-xs text-ink-400">{resume.chunks.length} sections indexed</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
          />
          <Button variant="secondary" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Replace resume
          </Button>

          <div className="border-t border-ink-100 pt-4 dark:border-ink-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Try asking</p>
            <div className="mt-2 space-y-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleAsk(prompt)}
                  disabled={!resume.embeddingReady || chatMutation.isPending}
                  className="block w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink-600 transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-ink-300 dark:hover:bg-ink-800"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Chat workspace — Siri-style canvas that follows the app's light/dark theme; only the orb itself stays fixed-dark */}
      <div className="relative flex flex-col overflow-hidden rounded-panel bg-white shadow-lift dark:bg-black lg:col-span-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(67,83,255,0.08),_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.18),_transparent_70%)]"
        />

        <div className="relative z-10 flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-white/10">
          <div>
            <h1 className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-white">
              <MessageCircle className="h-4 w-4 text-brand-500 dark:text-brand-400" /> Ask My Resume
            </h1>
            <p className="text-xs text-ink-500 dark:text-white/50">Answers are grounded in what your resume actually says.</p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMessages([])}
              className="border-ink-200 bg-ink-50 text-ink-700 hover:bg-ink-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              <Plus className="h-4 w-4" /> New chat
            </Button>
          )}
        </div>

        <div className="relative z-10 flex-1 space-y-4 overflow-y-auto px-5 py-6 lg:min-h-0">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-6 py-6 text-center">
                <SiriOrb size={88} />
                <div>
                  <p className="bg-gradient-to-b from-ink-900 to-ink-700 bg-clip-text text-xl font-semibold text-transparent dark:from-white dark:to-white/70">
                    Hi{firstName ? `, ${firstName}` : ""} 👋
                  </p>
                  <p className="mt-1 text-sm text-ink-500 dark:text-white/50">
                    Ask anything about your resume — I'll answer using what it actually says.
                  </p>
                </div>

                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-left dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-900/5 dark:bg-white/10">
                        <FileText className="h-3.5 w-3.5 text-ink-700 dark:text-white" />
                      </span>
                      <span className="truncate text-sm font-medium text-ink-900 dark:text-white">{resume.fileName}</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-500 dark:text-white/50">
                      {resume.embeddingReady
                        ? "Indexed and ready — every answer is grounded in this file."
                        : "Still processing — hang tight."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-left dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-white/40">
                      <ListChecks className="h-3.5 w-3.5" /> Indexed
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">{resume.chunks.length}</p>
                    <p className="text-xs text-ink-500 dark:text-white/50">sections searchable by the assistant</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAsk(SUGGESTED_PROMPTS[0])}
                    disabled={!resume.embeddingReady || chatMutation.isPending}
                    className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-left transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm dark:hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-white/40">
                      <Sparkles className="h-3.5 w-3.5" /> Suggested prompt
                    </div>
                    <p className="mt-2 text-sm text-ink-700 dark:text-white/80">{SUGGESTED_PROMPTS[0]}</p>
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.slice(1).map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleAsk(prompt)}
                      disabled={!resume.embeddingReady || chatMutation.isPending}
                      className="rounded-pill border border-ink-100 bg-ink-50 px-3.5 py-2 text-sm text-ink-600 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/10"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-2 border-t border-ink-100 pt-5 dark:border-white/10">
                  <Link
                    to="/app/career-fit"
                    className="flex items-center gap-1.5 rounded-pill border border-ink-200 px-3.5 py-2 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    <Target className="h-3.5 w-3.5" /> Career Fit
                  </Link>
                  <Link
                    to="/app/interview-prep"
                    className="flex items-center gap-1.5 rounded-pill border border-ink-200 px-3.5 py-2 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> Interview Prep
                  </Link>
                  <Link
                    to="/app/roadmaps"
                    className="flex items-center gap-1.5 rounded-pill border border-ink-200 px-3.5 py-2 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    <Map className="h-3.5 w-3.5" /> Learning Roadmap
                  </Link>
                </div>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="ml-auto max-w-[75%] rounded-2xl bg-brand-500 px-4 py-2.5 text-sm text-white">
                    {m.content}
                  </div>
                ) : (
                  <div key={i} className="max-w-[85%] space-y-2">
                    <div className="flex items-center gap-2">
                      <SiriOrb size={20} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-white/40">
                        Resume Assistant
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap pl-7 text-sm leading-relaxed text-ink-800 dark:text-white/90">{m.content}</p>
                  </div>
                ),
              )
            )}
            {chatMutation.isPending && (
              <div className="flex items-center gap-2 pl-1 text-sm text-ink-400 dark:text-white/40">
                <Spinner className="h-3.5 w-3.5" /> Thinking…
              </div>
            )}
          </div>
        </div>

        {chatError && <p className="relative z-10 px-5 text-sm text-red-500 dark:text-red-400">{chatError}</p>}
        <div className="relative z-10 border-t border-ink-100 px-5 py-4 dark:border-white/10">
          <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-pill border border-ink-200 bg-ink-50 px-2 py-2 dark:border-white/10 dark:bg-white/[0.06] dark:backdrop-blur-sm">
            <input
              className="h-9 flex-1 rounded-pill bg-transparent px-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 disabled:cursor-not-allowed dark:text-white dark:placeholder:text-white/35"
              placeholder="Ask about your resume…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              disabled={!resume.embeddingReady}
            />
            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={!resume.embeddingReady || !question.trim() || chatMutation.isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-all hover:scale-105 hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {chatMutation.isPending ? <Spinner className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
