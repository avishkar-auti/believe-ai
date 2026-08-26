import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Brain, Check, FolderPlus, Mic, Notebook, Plus, RotateCcw, Search, Sparkles, Tag, Trash2, X } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { cn } from "../../lib/cn.js";
import { NoteEditor } from "./NoteEditor.js";
import { SpeakToNote } from "./SpeakToNote.js";
import {
  askTutor,
  createFolder,
  createNote,
  deleteFolder,
  deleteNote,
  fetchDueFlashcardCount,
  fetchDueFlashcards,
  fetchFolders,
  fetchNote,
  fetchNotes,
  fetchTags,
  findRelatedNotes,
  generateFlashcards,
  generateQuiz,
  reviewFlashcard,
  saveFlashcardsForReview,
  searchNotes,
  summarizeNote,
  updateNote,
} from "./notesApi.js";
import type {
  NoteChatMessage,
  NoteFlashcardsResult,
  NoteQuizResult,
  NoteSearchResult,
  RelatedNote,
  ReviewGrade,
  VoiceCommandResult,
} from "@believe-ai/shared";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export function NotesPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  // Pre-select a note opened from outside the page (e.g. the "Open →" button
  // on a floated note) via ?note=<id> — read once on mount, not kept in sync
  // afterward, so picking a different note from the list doesn't fight the URL.
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => searchParams.get("note"));
  const [showSpeak, setShowSpeak] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newTag, setNewTag] = useState("");
  const [modal, setModal] = useState<"quiz" | "flashcards" | "tutor" | "related" | "review" | null>(null);
  const { data: dueCount } = useQuery({ queryKey: ["dueFlashcardCount"], queryFn: fetchDueFlashcardCount });
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["noteSearch", searchQuery],
    queryFn: () => searchNotes(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const { data: folders } = useQuery({ queryKey: ["noteFolders"], queryFn: fetchFolders });
  const { data: tags } = useQuery({ queryKey: ["noteTags"], queryFn: fetchTags });
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["notes", selectedFolderId, selectedTag],
    queryFn: () => fetchNotes({ folderId: selectedFolderId, tag: selectedTag }),
  });
  const { data: activeNote } = useQuery({
    queryKey: ["note", selectedNoteId],
    queryFn: () => fetchNote(selectedNoteId as string),
    enabled: !!selectedNoteId,
  });

  const createNoteMutation = useMutation({
    mutationFn: () => createNote({ title: "Untitled note", content: EMPTY_DOC, folderId: selectedFolderId }),
    onSuccess: (note) => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(note.id);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: (input: { title?: string; content?: Record<string, unknown>; tags?: string[] }) =>
      updateNote(selectedNoteId as string, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["note", selectedNoteId] });
      if (variables.tags) void queryClient.invalidateQueries({ queryKey: ["noteTags"] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(null);
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: () => createFolder({ name: newFolderName.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["noteFolders"] });
      setNewFolderName("");
      setShowNewFolder(false);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["noteFolders"] });
      if (selectedFolderId) setSelectedFolderId(undefined);
    },
  });

  // Debounced autosave — same pattern as PublicProfileSettingsPage's form fields.
  const [titleDraft, setTitleDraft] = useState("");
  useEffect(() => setTitleDraft(activeNote?.title ?? ""), [activeNote?.id, activeNote?.title]);
  useEffect(() => {
    if (!activeNote || titleDraft === activeNote.title) return;
    const timer = setTimeout(() => updateNoteMutation.mutate({ title: titleDraft }), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleDraft]);

  function handleContentChange(content: Record<string, unknown>) {
    updateNoteMutation.mutate({ content });
  }

  function handleAddTag() {
    const value = newTag.trim();
    if (!value || !activeNote || activeNote.tags.includes(value)) {
      setNewTag("");
      return;
    }
    updateNoteMutation.mutate({ tags: [...activeNote.tags, value] });
    setNewTag("");
  }

  function handleRemoveTag(tagToRemove: string) {
    if (!activeNote) return;
    updateNoteMutation.mutate({ tags: activeNote.tags.filter((t) => t !== tagToRemove) });
  }

  function appendNodes(doc: Record<string, unknown>, nodes: Record<string, unknown>[]) {
    const existing = Array.isArray(doc.content) ? (doc.content as Record<string, unknown>[]) : [];
    return { ...doc, content: [...existing, ...nodes] };
  }

  function handleVoiceCommand(command: VoiceCommandResult) {
    setShowSpeak(false);

    if (command.commandType === "create_note") {
      void createNote({ title: command.noteTitle || "Untitled note", content: EMPTY_DOC, folderId: selectedFolderId }).then((note) => {
        void queryClient.invalidateQueries({ queryKey: ["notes"] });
        setSelectedNoteId(note.id);
      });
      return;
    }

    if (!activeNote) return;

    if (command.commandType === "add_section") {
      const heading = { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: command.sectionTitle || "New section" }] };
      updateNoteMutation.mutate({ content: appendNodes(activeNote.content, [heading, { type: "paragraph" }]) });
      return;
    }

    if (command.commandType === "summarize") {
      void summarizeNote(activeNote.id).then((result) => {
        const summaryNodes = [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Summary" }] },
          { type: "paragraph", content: [{ type: "text", text: result.result }] },
        ];
        updateNoteMutation.mutate({ content: appendNodes(activeNote.content, summaryNodes) });
      });
      return;
    }

    if (command.commandType === "generate_questions") {
      setQuizQuestionCount(command.questionCount || 5);
      setModal("quiz");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Folders */}
      <div className="space-y-1 lg:col-span-2">
        <button
          type="button"
          onClick={() => {
            setSelectedFolderId(undefined);
            setSelectedTag(undefined);
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            !selectedFolderId && !selectedTag
              ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900"
              : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800",
          )}
        >
          <Notebook className="h-4 w-4" /> My notes
        </button>

        {!!dueCount && dueCount > 0 && (
          <button
            type="button"
            onClick={() => setModal("review")}
            className="flex w-full items-center justify-between gap-2 rounded-lg bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-700 dark:text-brand-300"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Review
            </span>
            <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-xs font-semibold text-white">{dueCount}</span>
          </button>
        )}

        {folders?.map((f) => (
          <div key={f.id} className="group flex items-center">
            <button
              type="button"
              onClick={() => setSelectedFolderId(f.id)}
              className={cn(
                "flex-1 truncate rounded-lg px-3 py-2 text-left text-sm",
                selectedFolderId === f.id ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900" : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800",
              )}
            >
              {f.name}
            </button>
            <button
              type="button"
              onClick={() => deleteFolderMutation.mutate(f.id)}
              className="hidden shrink-0 p-1.5 text-ink-300 hover:text-red-500 group-hover:block"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {showNewFolder ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newFolderName.trim()) createFolderMutation.mutate();
            }}
            className="px-1 pt-1"
          >
            <Input autoFocus placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewFolder(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-400 hover:text-ink-700 dark:hover:text-ink-100"
          >
            <FolderPlus className="h-4 w-4" /> New folder
          </button>
        )}

        {tags && tags.length > 0 && (
          <div className="pt-3">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Tags</p>
            <div className="flex flex-wrap gap-1.5 px-1">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTag((cur) => (cur === t ? undefined : t))}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-medium",
                    selectedTag === t
                      ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300"
                      : "border-ink-200 text-ink-500 hover:text-ink-800 dark:border-ink-700 dark:text-ink-400",
                  )}
                >
                  <Tag className="h-3 w-3" /> {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Note list */}
      <div className="space-y-2 lg:col-span-3">
        <Button size="sm" className="w-full" onClick={() => createNoteMutation.mutate()} disabled={createNoteMutation.isPending}>
          <Plus className="h-4 w-4" /> New note
        </Button>
        <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowSpeak(true)}>
          <Mic className="h-4 w-4" /> Speak
        </Button>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search your notes…"
            className="h-9 w-full rounded-lg border border-ink-200 bg-white pl-8 pr-3 text-sm text-ink-800 outline-none focus:border-ink-900 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:focus:border-ink-300"
          />
        </div>

        {searchQuery ? (
          searching ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-5 w-5 text-ink-400" />
            </div>
          ) : !searchResults || searchResults.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-ink-400">No matches for "{searchQuery}".</p>
          ) : (
            <div className="space-y-1">
              {searchResults.map((r) => (
                <SearchResultItem key={r.id} result={r} onClick={() => setSelectedNoteId(r.id)} />
              ))}
            </div>
          )
        ) : notesLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-5 w-5 text-ink-400" />
          </div>
        ) : !notes || notes.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-ink-400">No notes yet.</p>
        ) : (
          <div className="space-y-1">
            {notes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSelectedNoteId(n.id)}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-sm",
                  selectedNoteId === n.id ? "bg-brand-500/10 text-brand-700 dark:text-brand-300" : "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800",
                )}
              >
                <span className="block truncate">{n.title || "Untitled note"}</span>
                {n.tags.length > 0 && (
                  <span className="mt-0.5 block truncate text-xs text-ink-400">{n.tags.map((t) => `#${t}`).join(" ")}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="lg:col-span-7">
        {!selectedNoteId || !activeNote ? (
          <EmptyState
            icon={<Notebook className="h-8 w-8 text-ink-300" />}
            title="Pick a note, or start a new one"
            description="Write, paste, or speak something — Believe.ai will help organize it."
          />
        ) : (
          <div className="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
            <div className="mb-3 flex items-center justify-between gap-2">
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                placeholder="Untitled note"
                className="flex-1 border-none bg-transparent text-lg font-semibold text-ink-900 outline-none dark:text-white"
              />
              <button type="button" onClick={() => deleteNoteMutation.mutate(activeNote.id)} className="text-ink-300 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {activeNote.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-pill border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-600 dark:border-ink-700 dark:text-ink-300"
                >
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)} className="text-ink-400 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTag();
                }}
                className="inline-flex items-center"
              >
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="+ tag"
                  className="w-20 border-none bg-transparent text-xs text-ink-500 outline-none placeholder:text-ink-400 dark:text-ink-300"
                />
              </form>
            </div>

            <div className="mb-3 flex flex-wrap gap-2 border-b border-ink-100 pb-3 dark:border-ink-700">
              <Button variant="secondary" size="sm" onClick={() => setModal("tutor")}>
                <Sparkles className="h-4 w-4" /> Ask AI
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuizQuestionCount(5);
                  setModal("quiz");
                }}
              >
                <Brain className="h-4 w-4" /> Create quiz
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModal("flashcards")}>
                <BookOpen className="h-4 w-4" /> Flashcards
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModal("related")}>
                Related notes
              </Button>
            </div>

            <NoteEditor key={activeNote.id} noteId={activeNote.id} content={activeNote.content} onChange={handleContentChange} />
          </div>
        )}
      </div>

      {showSpeak && (
        <SpeakToNote
          onClose={() => setShowSpeak(false)}
          hasActiveNote={!!activeNote}
          onCommand={handleVoiceCommand}
          onInsert={({ title, content }) => {
            void createNote({ title, content, folderId: selectedFolderId }).then((note) => {
              void queryClient.invalidateQueries({ queryKey: ["notes"] });
              setSelectedNoteId(note.id);
              setShowSpeak(false);
            });
          }}
        />
      )}

      {modal === "quiz" && activeNote && (
        <QuizModal noteId={activeNote.id} questionCount={quizQuestionCount} onClose={() => setModal(null)} />
      )}
      {modal === "flashcards" && activeNote && <FlashcardsModal noteId={activeNote.id} onClose={() => setModal(null)} />}
      {modal === "related" && activeNote && (
        <RelatedModal
          noteId={activeNote.id}
          onClose={() => setModal(null)}
          onSelect={(id) => {
            setSelectedNoteId(id);
            setModal(null);
          }}
        />
      )}
      {modal === "tutor" && <TutorModal onClose={() => setModal(null)} />}
      {modal === "review" && (
        <ReviewModal
          onClose={() => {
            setModal(null);
            void queryClient.invalidateQueries({ queryKey: ["dueFlashcardCount"] });
          }}
        />
      )}
    </div>
  );
}

function SearchResultItem({ result, onClick }: { result: NoteSearchResult; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{result.title || "Untitled note"}</span>
        {typeof result.score === "number" && <span className="shrink-0 text-xs text-ink-400">{Math.round(result.score * 100)}%</span>}
      </span>
      <span className="mt-0.5 block truncate text-xs text-ink-400">{result.snippet}</span>
    </button>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-100">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function QuizModal({ noteId, questionCount, onClose }: { noteId: string; questionCount: number; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery<NoteQuizResult>({
    queryKey: ["noteQuiz", noteId, questionCount],
    queryFn: () => generateQuiz(noteId, questionCount),
  });
  return (
    <ModalShell title="Quiz" onClose={onClose}>
      {isLoading ? (
        <Spinner className="mx-auto h-5 w-5 text-ink-400" />
      ) : isError || !data ? (
        <p className="text-sm text-red-500">Couldn't generate a quiz — try again.</p>
      ) : (
        <div className="space-y-4">
          {data.questions.map((q, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-ink-900 dark:text-white">
                {i + 1}. {q.question}
              </p>
              <ul className="mt-1.5 space-y-1">
                {q.options.map((opt, oi) => (
                  <li
                    key={oi}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs",
                      oi === q.correctIndex ? "bg-lime-500/15 text-lime-700 dark:text-lime-400" : "text-ink-600 dark:text-ink-300",
                    )}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
              {q.explanation && <p className="mt-1 text-xs text-ink-400">{q.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function FlashcardsModal({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery<NoteFlashcardsResult>({
    queryKey: ["noteFlashcards", noteId],
    queryFn: () => generateFlashcards(noteId),
  });
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const saveMutation = useMutation({
    mutationFn: () => saveFlashcardsForReview(noteId, data?.cards.length || 8),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["dueFlashcardCount"] }),
  });

  return (
    <ModalShell title="Flashcards" onClose={onClose}>
      {isLoading ? (
        <Spinner className="mx-auto h-5 w-5 text-ink-400" />
      ) : isError || !data ? (
        <p className="text-sm text-red-500">Couldn't generate flashcards — try again.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.cards.map((card, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFlipped((s) => (s.has(i) ? new Set([...s].filter((x) => x !== i)) : new Set([...s, i])))}
                className="rounded-xl border border-ink-100 bg-ink-50 p-3 text-left text-xs dark:border-ink-700 dark:bg-ink-800/60"
              >
                <p className="font-medium text-ink-900 dark:text-white">{flipped.has(i) ? card.back : card.front}</p>
                <p className="mt-1 text-[10px] text-ink-400">{flipped.has(i) ? "Answer — click to flip" : "Question — click to flip"}</p>
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || saveMutation.isSuccess}
          >
            {saveMutation.isSuccess ? (
              <>
                <Check className="h-4 w-4" /> Saved for review
              </>
            ) : saveMutation.isPending ? (
              "Saving…"
            ) : (
              <>
                <RotateCcw className="h-4 w-4" /> Save for spaced review
              </>
            )}
          </Button>
        </>
      )}
    </ModalShell>
  );
}

function RelatedModal({ noteId, onClose, onSelect }: { noteId: string; onClose: () => void; onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery<RelatedNote[]>({ queryKey: ["noteRelated", noteId], queryFn: () => findRelatedNotes(noteId) });
  return (
    <ModalShell title="Related notes" onClose={onClose}>
      {isLoading ? (
        <Spinner className="mx-auto h-5 w-5 text-ink-400" />
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-ink-400">No related notes found yet.</p>
      ) : (
        <div className="space-y-1">
          {data.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect(n.id)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
            >
              {n.title}
              {typeof n.score === "number" && <span className="text-xs text-ink-400">{Math.round(n.score * 100)}%</span>}
            </button>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function TutorModal({ onClose }: { onClose: () => void }) {
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
    <ModalShell title="Ask your notes" onClose={onClose}>
      <div className="mb-3 max-h-[300px] space-y-2 overflow-y-auto">
        {messages.length === 0 && <p className="text-sm text-ink-400">Ask a question — answers are grounded only in your own notes.</p>}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl px-3 py-2 text-sm",
              m.role === "user" ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900" : "bg-ink-50 text-ink-700 dark:bg-ink-800/60 dark:text-ink-200",
            )}
          >
            {m.content}
          </div>
        ))}
        {mutation.isPending && <Spinner className="h-4 w-4 text-ink-400" />}
        {mutation.isError && <p className="text-sm text-red-500">Couldn't get an answer — try again.</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) mutation.mutate(question.trim());
        }}
        className="flex gap-2"
      >
        <Input placeholder="Ask a question about your notes…" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <Button type="submit" disabled={!question.trim() || mutation.isPending}>
          Ask
        </Button>
      </form>
    </ModalShell>
  );
}

const GRADE_BUTTONS: { grade: ReviewGrade; label: string; className: string }[] = [
  { grade: "again", label: "Again", className: "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400" },
  { grade: "hard", label: "Hard", className: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400" },
  { grade: "good", label: "Good", className: "bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 dark:text-brand-300" },
  { grade: "easy", label: "Easy", className: "bg-lime-500/10 text-lime-700 hover:bg-lime-500/20 dark:text-lime-400" },
];

function ReviewModal({ onClose }: { onClose: () => void }) {
  const { data: cards, isLoading } = useQuery({ queryKey: ["dueFlashcards"], queryFn: () => fetchDueFlashcards() });
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const gradeMutation = useMutation({
    mutationFn: (grade: ReviewGrade) => reviewFlashcard(cards?.[index]?.id ?? "", grade),
    onSuccess: () => {
      setShowBack(false);
      setIndex((i) => i + 1);
    },
  });

  const current = cards?.[index];

  return (
    <ModalShell title="Review" onClose={onClose}>
      {isLoading ? (
        <Spinner className="mx-auto h-5 w-5 text-ink-400" />
      ) : !cards || cards.length === 0 ? (
        <p className="text-sm text-ink-400">No cards due for review right now — nice work.</p>
      ) : !current ? (
        <div className="py-6 text-center">
          <Check className="mx-auto h-8 w-8 text-lime-500" />
          <p className="mt-2 text-sm font-medium text-ink-800 dark:text-ink-100">All done for now.</p>
          <p className="text-xs text-ink-400">Come back later for the next batch.</p>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs text-ink-400">
            {index + 1} of {cards.length} · {current.noteTitle}
          </p>
          <button
            type="button"
            onClick={() => setShowBack((s) => !s)}
            className="flex min-h-[140px] w-full items-center justify-center rounded-2xl border border-ink-100 bg-ink-50 p-6 text-center text-sm font-medium text-ink-900 dark:border-ink-700 dark:bg-ink-800/60 dark:text-white"
          >
            {showBack ? current.back : current.front}
          </button>
          <p className="mt-2 text-center text-[11px] text-ink-400">{showBack ? "Answer — tap to flip back" : "Tap to reveal the answer"}</p>

          {showBack && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {GRADE_BUTTONS.map(({ grade, label, className }) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => gradeMutation.mutate(grade)}
                  disabled={gradeMutation.isPending}
                  className={cn("rounded-lg px-2 py-2 text-xs font-semibold transition-colors disabled:opacity-50", className)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
