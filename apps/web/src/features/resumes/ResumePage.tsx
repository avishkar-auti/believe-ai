import { useEffect, useRef, useState } from "react";
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
  Star,
  Target,
  Trash2,
} from "lucide-react";
import type { Resume } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { SiriOrb } from "../../components/ui/SiriOrb.js";
import { cn } from "../../lib/cn.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import {
  askResume,
  deleteResume,
  fetchResumes,
  setPrimaryResume,
  uploadResume,
  type ResumeChatMessage,
} from "./resumeApi.js";

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
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [pendingTargetRole, setPendingTargetRole] = useState("");

  const { data: resumes, isLoading } = useQuery({ queryKey: ["resumes"], queryFn: fetchResumes });

  // Default the chat to the Primary resume, but only take over the selection
  // once — a user actively browsing the library shouldn't get yanked back.
  useEffect(() => {
    if (!resumes || resumes.length === 0) return;
    if (selectedResumeId && resumes.some((r) => r.id === selectedResumeId)) return;
    setSelectedResumeId(resumes.find((r) => r.isPrimary)?.id ?? resumes[0]?.id ?? null);
  }, [resumes, selectedResumeId]);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["resumes"] });
  }

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadResume(file, pendingTargetRole.trim() || undefined),
    onSuccess: (data) => {
      invalidate();
      setSelectedResumeId(data.id);
      setMessages([]);
      setPendingTargetRole("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: (_data, deletedId) => {
      invalidate();
      if (deletedId === selectedResumeId) setSelectedResumeId(null);
      setMessages([]);
    },
  });

  const setPrimaryMutation = useMutation({ mutationFn: setPrimaryResume, onSuccess: invalidate });

  const chatMutation = useMutation({
    mutationFn: ({ text, history }: { text: string; history: ResumeChatMessage[] }) => {
      if (!selectedResumeId) throw new Error("No resume selected");
      return askResume(selectedResumeId, text, history);
    },
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
  const resume = resumes?.find((r) => r.id === selectedResumeId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6 text-fg-subtle" />
      </div>
    );
  }

  if (!resumes || resumes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-h1 text-fg">
            <MessageCircle className="h-5 w-5 text-accent" /> Ask My Resume
          </h1>
          <p className="text-sm text-fg-muted">
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
                  {uploadMutation.isError && <p className="mt-2 text-sm text-critical">Couldn't read that PDF — try another file.</p>}
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
      {/* Resume library + context rail for the selected resume */}
      <Card className="flex flex-col lg:col-span-1 lg:overflow-y-auto">
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-section uppercase text-fg-subtle">Your resumes</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              aria-label="Add resume"
              className="rounded-control p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg"
            >
              <Plus className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
            />
          </div>

          <input
            placeholder="Target role (optional) — e.g. AI/ML Engineer"
            value={pendingTargetRole}
            onChange={(e) => setPendingTargetRole(e.target.value)}
            className="w-full rounded-control border border-line bg-surface px-2.5 py-1.5 text-xs text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />

          <ul className="space-y-1.5">
            {resumes.map((r) => (
              <ResumeRow
                key={r.id}
                resume={r}
                selected={r.id === selectedResumeId}
                onSelect={() => {
                  setSelectedResumeId(r.id);
                  setMessages([]);
                }}
                onSetPrimary={() => setPrimaryMutation.mutate(r.id)}
                onDelete={() => deleteMutation.mutate(r.id)}
                busy={setPrimaryMutation.isPending || deleteMutation.isPending}
              />
            ))}
          </ul>
          {uploadMutation.isPending && <p className="text-caption text-fg-subtle">Uploading…</p>}
          {uploadMutation.isError && <p className="text-caption text-critical">Couldn't read that PDF — try another file.</p>}

          {resume && (
            <div className="border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Try asking</p>
              <div className="mt-2 space-y-1.5">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleAsk(prompt)}
                    disabled={!resume.embeddingReady || chatMutation.isPending}
                    className="block w-full rounded-lg px-2.5 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Chat workspace — Siri-style canvas that follows the app's light/dark theme; only the orb itself stays fixed-dark */}
      <div className="relative flex flex-col overflow-hidden rounded-panel bg-white shadow-lift dark:bg-black lg:col-span-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(67,83,255,0.08),_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.18),_transparent_70%)]"
        />

        <div className="relative z-10 flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-white">
              <MessageCircle className="h-4 w-4 text-accent" /> Ask My Resume
            </h1>
            <p className="truncate text-xs text-ink-500 dark:text-white/50">
              {resume ? `Chatting with: ${resume.targetRole ?? resume.fileName}` : "Select a resume to start"}
            </p>
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
            {!resume ? (
              <p className="py-16 text-center text-sm text-ink-500 dark:text-white/50">Pick a resume from the left to chat with it.</p>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center gap-6 py-6 text-center">
                <SiriOrb size={88} />
                <div>
                  <p className="bg-gradient-to-b from-ink-900 to-ink-700 bg-clip-text text-xl font-semibold text-transparent dark:from-white dark:to-white/70">
                    Hi{firstName ? `, ${firstName}` : ""} 👋
                  </p>
                  <p className="mt-1 text-sm text-ink-500 dark:text-white/50">
                    Ask anything about this resume — I'll answer using what it actually says.
                  </p>
                </div>

                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-left dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-900/5 dark:bg-white/10">
                        <FileText className="h-3.5 w-3.5 text-ink-700 dark:text-white" />
                      </span>
                      <span className="truncate text-sm font-medium text-ink-900 dark:text-white">{resume.targetRole ?? resume.fileName}</span>
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
                  <div key={i} className="ml-auto max-w-[75%] rounded-2xl bg-accent px-4 py-2.5 text-sm text-accent-fg">
                    {m.content}
                  </div>
                ) : (
                  <div key={i} className="max-w-[85%] space-y-2">
                    <div className="flex items-center gap-2">
                      <SiriOrb size={20} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-white/40">Resume Assistant</span>
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

        {chatError && <p className="relative z-10 px-5 text-sm text-critical">{chatError}</p>}
        <div className="relative z-10 border-t border-ink-100 px-5 py-4 dark:border-white/10">
          <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-pill border border-ink-200 bg-ink-50 px-2 py-2 dark:border-white/10 dark:bg-white/[0.06] dark:backdrop-blur-sm">
            <input
              className="h-9 flex-1 rounded-pill bg-transparent px-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 disabled:cursor-not-allowed dark:text-white dark:placeholder:text-white/35"
              placeholder="Ask about this resume…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              disabled={!resume?.embeddingReady}
            />
            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={!resume?.embeddingReady || !question.trim() || chatMutation.isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {chatMutation.isPending ? <Spinner className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumeRow({
  resume,
  selected,
  onSelect,
  onSetPrimary,
  onDelete,
  busy,
}: {
  resume: Resume;
  selected: boolean;
  onSelect: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-control border px-2.5 py-2 transition-colors",
          selected ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong",
        )}
      >
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <FileText className={cn("h-4 w-4 shrink-0", selected ? "text-accent" : "text-fg-subtle")} />
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate text-sm font-medium", selected ? "text-accent" : "text-fg")}>
              {resume.targetRole ?? resume.fileName}
            </span>
            <Badge tone={resume.embeddingReady ? "success" : "warning"} className="mt-0.5 py-0 text-[10px]">
              {resume.embeddingReady ? "Ready" : "Processing…"}
            </Badge>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          {resume.isPrimary ? (
            <span title="Primary resume" className="p-1 text-caution">
              <Star className="h-3.5 w-3.5 fill-current" />
            </span>
          ) : (
            <button
              type="button"
              title="Set as primary"
              onClick={onSetPrimary}
              disabled={busy}
              className="rounded-control p-1 text-fg-subtle opacity-0 hover:text-caution group-hover:opacity-100"
            >
              <Star className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            title="Delete"
            onClick={onDelete}
            disabled={busy}
            className="rounded-control p-1 text-fg-subtle opacity-0 hover:text-critical group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}
