import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Brain, Check, ClipboardList, RotateCcw, Send, Sparkles } from "lucide-react";
import type { Note, NoteChatMessage } from "@believe-ai/shared";
import { Drawer } from "../../components/ui/Drawer.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { cn } from "../../lib/cn.js";
import {
  askTutor,
  findRelatedNotes,
  generateFlashcards,
  generateQuiz,
  saveFlashcardsForReview,
  summarizeNote,
  transformNoteText,
} from "./notesApi.js";

/** Note-type-aware relabeling of the same real capabilities — never a new
 * backend action, just the framing that fits what the note is actually about
 * (§17). Falls back to generic labels for anything untagged. */
function suggestionLabels(tags: string[]) {
  const lower = tags.map((t) => t.toLowerCase());
  if (lower.some((t) => t.includes("interview"))) {
    return { quiz: "Generate practice questions", summarize: "Summarize key concepts", flashcards: "Create flashcards" };
  }
  if (lower.some((t) => t.includes("campaign"))) {
    return { quiz: "Create quiz", summarize: "Summarize campaign notes", flashcards: "Create flashcards" };
  }
  if (lower.some((t) => t.includes("job"))) {
    return { quiz: "Create quiz", summarize: "Extract requirements", flashcards: "Create flashcards" };
  }
  return { quiz: "Create quiz", summarize: "Summarize this note", flashcards: "Create flashcards" };
}

export type NoteAIPanel = "menu" | "summary" | "actionItems" | "quiz" | "flashcards" | "related" | "ask";

export function NoteAISuggestions({
  note,
  open,
  onClose,
  initialPanel = "menu",
  initialQuestionCount = 5,
}: {
  note: Note;
  open: boolean;
  onClose: () => void;
  /** Lets a voice command ("generate 8 questions") jump straight to a
   * sub-panel instead of landing on the menu. */
  initialPanel?: NoteAIPanel;
  initialQuestionCount?: number;
}) {
  const [panel, setPanel] = useState<NoteAIPanel>(initialPanel);
  useEffect(() => {
    if (open) setPanel(initialPanel);
  }, [open, initialPanel]);
  const labels = suggestionLabels(note.tags);

  return (
    <Drawer
      open={open}
      title={panel === "menu" ? "Ask Believe" : "Ask Believe"}
      subtitle={panel === "menu" ? "About this note" : undefined}
      onClose={() => {
        onClose();
        setPanel("menu");
      }}
    >
      {panel === "menu" && (
        <div className="space-y-1">
          <SuggestionRow icon={Sparkles} label={labels.summarize} onClick={() => setPanel("summary")} />
          <SuggestionRow icon={ClipboardList} label="Extract action items" onClick={() => setPanel("actionItems")} />
          <SuggestionRow icon={Brain} label={labels.quiz} onClick={() => setPanel("quiz")} />
          <SuggestionRow icon={BookOpen} label={labels.flashcards} onClick={() => setPanel("flashcards")} />
          <SuggestionRow icon={Sparkles} label="Related notes" onClick={() => setPanel("related")} />
          <div className="my-2 h-px bg-line" />
          <SuggestionRow icon={Send} label="Ask a question…" onClick={() => setPanel("ask")} />
        </div>
      )}
      {panel === "summary" && <SummaryPanel noteId={note.id} onBack={() => setPanel("menu")} />}
      {panel === "actionItems" && <ActionItemsPanel noteId={note.id} onBack={() => setPanel("menu")} />}
      {panel === "quiz" && <QuizPanel noteId={note.id} questionCount={initialQuestionCount} onBack={() => setPanel("menu")} />}
      {panel === "flashcards" && <FlashcardsPanel noteId={note.id} onBack={() => setPanel("menu")} />}
      {panel === "related" && <RelatedPanel noteId={note.id} onBack={() => setPanel("menu")} />}
      {panel === "ask" && <AskPanel onBack={() => setPanel("menu")} />}
    </Drawer>
  );
}

function AiButton({
  onClick,
  disabled,
  variant = "primary",
  className,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-pill px-3.5 py-2 text-caption font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" ? "bg-accent text-accent-fg hover:bg-accent-hover" : "border border-line text-fg hover:bg-fg/[0.05]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function BackRow({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="mb-3 text-caption font-medium text-fg-subtle hover:text-fg">
      ← All suggestions
    </button>
  );
}

function SuggestionRow({ icon: Icon, label, onClick }: { icon: typeof Sparkles; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-label text-fg transition-colors hover:bg-fg/[0.05]"
    >
      <Icon className="h-4 w-4 text-accent" /> {label}
    </button>
  );
}

function SummaryPanel({ noteId, onBack }: { noteId: string; onBack: () => void }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ["noteSummary", noteId], queryFn: () => summarizeNote(noteId) });
  return (
    <div>
      <BackRow onBack={onBack} />
      {isLoading ? (
        <Spinner className="mx-auto h-5 w-5 text-fg-subtle" />
      ) : isError || !data ? (
        <p className="text-caption text-critical">Couldn't summarize — try again.</p>
      ) : (
        <p className="rounded-lg surface-2 surface-edge p-3 text-label leading-relaxed text-fg">{data.result}</p>
      )}
    </div>
  );
}

function ActionItemsPanel({ noteId, onBack }: { noteId: string; onBack: () => void }) {
  // Whole-note action-item extraction reuses the selection-transform endpoint
  // with the note's own summary as a stand-in for "the whole note text" —
  // summarize already extracts the note's plain text server-side, so this
  // avoids duplicating that extraction on the client.
  const { data: summary } = useQuery({ queryKey: ["noteSummary", noteId], queryFn: () => summarizeNote(noteId) });
  const mutation = useMutation({
    mutationFn: () => transformNoteText(summary?.result ?? "", "extract_action_items"),
    onSuccess: () => undefined,
  });

  return (
    <div>
      <BackRow onBack={onBack} />
      {!mutation.data && !mutation.isPending && (
        <AiButton onClick={() => mutation.mutate()} disabled={!summary}>
          <ClipboardList className="h-3.5 w-3.5" /> Extract action items
        </AiButton>
      )}
      {mutation.isPending && <Spinner className="mx-auto mt-3 h-5 w-5 text-fg-subtle" />}
      {mutation.isError && <p className="mt-2 text-caption text-critical">Couldn't extract action items — try again.</p>}
      {mutation.data && (
        <div className="mt-2 space-y-1.5">
          {mutation.data.result
            .split("\n")
            .map((line) => line.replace(/^- \[ \]\s*/, "").trim())
            .filter(Boolean)
            .map((item, i) => (
              <label key={i} className="flex items-start gap-2 text-label text-fg">
                <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-accent" disabled />
                {item}
              </label>
            ))}
        </div>
      )}
    </div>
  );
}

function QuizPanel({ noteId, questionCount, onBack }: { noteId: string; questionCount: number; onBack: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["noteQuiz", noteId, questionCount],
    queryFn: () => generateQuiz(noteId, questionCount),
  });
  return (
    <div>
      <BackRow onBack={onBack} />
      {isLoading ? (
        <Spinner className="mx-auto h-5 w-5 text-fg-subtle" />
      ) : isError || !data ? (
        <p className="text-caption text-critical">Couldn't generate a quiz — try again.</p>
      ) : (
        <div className="space-y-4">
          {data.questions.map((q, i) => (
            <div key={i}>
              <p className="text-label font-medium text-fg">
                {i + 1}. {q.question}
              </p>
              <ul className="mt-1.5 space-y-1">
                {q.options.map((opt, oi) => (
                  <li key={oi} className={cn("rounded-lg px-2.5 py-1.5 text-caption", oi === q.correctIndex ? "bg-positive/10 text-positive" : "text-fg-muted")}>
                    {opt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FlashcardsPanel({ noteId, onBack }: { noteId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["noteFlashcards", noteId], queryFn: () => generateFlashcards(noteId) });
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const saveMutation = useMutation({
    mutationFn: () => saveFlashcardsForReview(noteId, data?.cards.length || 8),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["dueFlashcardCount"] }),
  });

  return (
    <div>
      <BackRow onBack={onBack} />
      {isLoading ? (
        <Spinner className="mx-auto h-5 w-5 text-fg-subtle" />
      ) : isError || !data ? (
        <p className="text-caption text-critical">Couldn't generate flashcards — try again.</p>
      ) : (
        <>
          <div className="space-y-2">
            {data.cards.map((card, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFlipped((s) => (s.has(i) ? new Set([...s].filter((x) => x !== i)) : new Set([...s, i])))}
                className="w-full rounded-xl surface-2 surface-edge p-3 text-left text-caption"
              >
                <p className="font-medium text-fg">{flipped.has(i) ? card.back : card.front}</p>
                <p className="mt-1 text-[10px] text-fg-subtle">{flipped.has(i) ? "Answer — tap to flip" : "Question — tap to flip"}</p>
              </button>
            ))}
          </div>
          <AiButton variant="secondary" className="mt-4 w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || saveMutation.isSuccess}>
            {saveMutation.isSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" /> Saved for review
              </>
            ) : saveMutation.isPending ? (
              "Saving…"
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" /> Save for spaced review
              </>
            )}
          </AiButton>
        </>
      )}
    </div>
  );
}

function RelatedPanel({ noteId, onBack }: { noteId: string; onBack: () => void }) {
  const { data, isLoading } = useQuery({ queryKey: ["noteRelated", noteId], queryFn: () => findRelatedNotes(noteId) });
  return (
    <div>
      <BackRow onBack={onBack} />
      {isLoading ? (
        <Spinner className="mx-auto h-5 w-5 text-fg-subtle" />
      ) : !data || data.length === 0 ? (
        <p className="text-caption text-fg-subtle">No related notes found yet.</p>
      ) : (
        <div className="space-y-1">
          {data.map((n) => (
            <div key={n.id} className="flex items-center justify-between rounded-lg px-2.5 py-2 text-label text-fg">
              {n.title}
              {typeof n.score === "number" && <span className="text-caption text-fg-subtle">{Math.round(n.score * 100)}%</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AskPanel({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<NoteChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const mutation = useMutation({
    mutationFn: (q: string) => askTutor(q, messages),
    onSuccess: (result, q) => {
      setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: result.answer }]);
      setQuestion("");
    },
  });

  return (
    <div className="flex h-full flex-col">
      <BackRow onBack={onBack} />
      <div className="flex-1 space-y-2 overflow-y-auto">
        {messages.length === 0 && <p className="text-caption text-fg-subtle">Ask a question — answers are grounded only in your own notes.</p>}
        {messages.map((m, i) => (
          <div key={i} className={cn("rounded-xl px-3 py-2 text-label", m.role === "user" ? "bg-accent text-accent-fg" : "surface-2 text-fg")}>
            {m.content}
          </div>
        ))}
        {mutation.isPending && <Spinner className="h-4 w-4 text-fg-subtle" />}
        {mutation.isError && <p className="text-caption text-critical">Couldn't get an answer — try again.</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) mutation.mutate(question.trim());
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your notes…"
          className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-label text-fg outline-none focus:border-accent"
        />
        <AiButton onClick={() => question.trim() && mutation.mutate(question.trim())} disabled={!question.trim() || mutation.isPending}>
          Ask
        </AiButton>
      </form>
    </div>
  );
}
