import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Mic, Notebook, Plus } from "lucide-react";
import type { ReviewGrade, UpdateNoteInput, VoiceCommandResult } from "@believe-ai/shared";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { toast } from "../../components/ui/Toast.js";
import { cn } from "../../lib/cn.js";
import { Z } from "../../lib/zIndex.js";
import { NoteEditor } from "./NoteEditor.js";
import { NotesSidebar, type NotesView } from "./NotesSidebar.js";
import { NotesList } from "./NotesList.js";
import { NoteAISuggestions } from "./NoteAISuggestions.js";
import { NoteInfoDrawer } from "./NoteInfoDrawer.js";
import { SpeakToNote } from "./SpeakToNote.js";
import type { NotesFilterState } from "./NotesFilters.js";
import {
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
  permanentlyDeleteNote,
  restoreNote,
  reviewFlashcard,
  searchNotes,
  summarizeNote,
  updateNote,
} from "./notesApi.js";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

function toBackendView(view: NotesView) {
  if (view === "archived") return "archived" as const;
  if (view === "trash") return "trash" as const;
  return "active" as const;
}

export function NotesPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [view, setView] = useState<NotesView>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  // Pre-select a note opened from outside the page (e.g. the "Open →" button
  // on a floated note) via ?note=<id> — read once on mount, not kept in sync
  // afterward, so picking a different note from the list doesn't fight the URL.
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => searchParams.get("note"));
  const [showSpeak, setShowSpeak] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitial, setAiInitial] = useState<{ panel: "menu" | "quiz"; questionCount: number }>({ panel: "menu", questionCount: 5 });
  const [infoOpen, setInfoOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [confirmPermanentDeleteId, setConfirmPermanentDeleteId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<NotesFilterState>({ date: "any", linkedOnly: false });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [saveState]);

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["noteSearch", searchQuery],
    queryFn: () => searchNotes(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const { data: folders } = useQuery({ queryKey: ["noteFolders"], queryFn: fetchFolders });
  const { data: tags } = useQuery({ queryKey: ["noteTags"], queryFn: fetchTags });
  const { data: dueCount } = useQuery({ queryKey: ["dueFlashcardCount"], queryFn: fetchDueFlashcardCount });

  const backendView = toBackendView(view);
  const { data: rawNotes, isLoading: notesLoading } = useQuery({
    queryKey: ["notes", backendView, selectedFolderId, selectedTag],
    queryFn: () => fetchNotes({ folderId: selectedFolderId, tag: selectedTag, view: backendView }),
  });
  const notes =
    !rawNotes || view === "all" || view === "archived" || view === "trash"
      ? rawNotes
      : view === "pinned"
        ? rawNotes.filter((n) => n.pinned)
        : [...rawNotes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 30);

  const { data: activeNote } = useQuery({
    queryKey: ["note", selectedNoteId],
    queryFn: () => fetchNote(selectedNoteId as string),
    enabled: !!selectedNoteId,
  });

  const createNoteMutation = useMutation({
    mutationFn: () => createNote({ title: "", content: EMPTY_DOC, folderId: selectedFolderId }),
    onSuccess: (note) => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      setView("all");
      setSelectedNoteId(note.id);
    },
  });

  // Autosave for the currently-open note's own title/content/tags — drives
  // the "Saving…" / "Saved" indicator in the editor header.
  const saveMutation = useMutation({
    mutationFn: (input: UpdateNoteInput) => updateNote(selectedNoteId as string, input),
    onMutate: () => setSaveState("saving"),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["note", selectedNoteId] });
      if (variables.tags) void queryClient.invalidateQueries({ queryKey: ["noteTags"] });
      setSaveState("saved");
    },
  });

  // One-off patches (pin/archive/move) triggered from the list for any note
  // — not necessarily the one currently open — so it's kept separate from
  // the editor's own save-state.
  const patchMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) => updateNote(id, input),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["note", id] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreNote(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["note", id] });
    },
  });

  const trashMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      if (selectedNoteId === id) setSelectedNoteId(null);
      toast("Note moved to trash", "neutral", { label: "Undo", onAction: () => restoreMutation.mutate(id) });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: string) => permanentlyDeleteNote(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      if (selectedNoteId === id) setSelectedNoteId(null);
      setConfirmPermanentDeleteId(null);
      toast("Note permanently deleted", "danger");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const full = await fetchNote(id);
      return createNote({ title: full.title, content: full.content, folderId: full.folderId, tags: full.tags });
    },
    onSuccess: (note) => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNoteId(note.id);
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createFolder({ name }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["noteFolders"] }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ["noteFolders"] });
      if (selectedFolderId === id) setSelectedFolderId(undefined);
    },
  });

  // Debounced autosave — same pattern as EditProfileDrawer's form fields.
  const [titleDraft, setTitleDraft] = useState("");
  useEffect(() => setTitleDraft(activeNote?.title ?? ""), [activeNote?.id, activeNote?.title]);
  useEffect(() => {
    if (!activeNote || titleDraft === activeNote.title) return;
    const timer = setTimeout(() => saveMutation.mutate({ title: titleDraft }), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleDraft]);

  const contentSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (contentSaveTimer.current) clearTimeout(contentSaveTimer.current);
    };
  }, [selectedNoteId]);

  function handleContentChange(content: Record<string, unknown>) {
    setSaveState("saving");
    if (contentSaveTimer.current) clearTimeout(contentSaveTimer.current);
    contentSaveTimer.current = setTimeout(() => saveMutation.mutate({ content }), 600);
  }

  function handleAddTag(tag: string) {
    if (!activeNote || activeNote.tags.includes(tag)) return;
    saveMutation.mutate({ tags: [...activeNote.tags, tag] });
  }

  function handleRemoveTag(tag: string) {
    if (!activeNote) return;
    saveMutation.mutate({ tags: activeNote.tags.filter((t) => t !== tag) });
  }

  function handleArchiveToggle(id: string, archived: boolean) {
    patchMutation.mutate({ id, input: { archived } });
    if (archived) {
      toast("Note archived", "neutral", { label: "Undo", onAction: () => patchMutation.mutate({ id, input: { archived: false } }) });
    }
  }

  function appendNodes(doc: Record<string, unknown>, nodes: Record<string, unknown>[]) {
    const existing = Array.isArray(doc.content) ? (doc.content as Record<string, unknown>[]) : [];
    return { ...doc, content: [...existing, ...nodes] };
  }

  function handleVoiceCommand(command: VoiceCommandResult) {
    setShowSpeak(false);

    if (command.commandType === "create_note") {
      void createNote({ title: command.noteTitle || "", content: EMPTY_DOC, folderId: selectedFolderId }).then((note) => {
        void queryClient.invalidateQueries({ queryKey: ["notes"] });
        setView("all");
        setSelectedNoteId(note.id);
      });
      return;
    }

    if (!activeNote) return;

    if (command.commandType === "add_section") {
      const heading = { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: command.sectionTitle || "New section" }] };
      saveMutation.mutate({ content: appendNodes(activeNote.content, [heading, { type: "paragraph" }]) });
      return;
    }

    if (command.commandType === "summarize") {
      void summarizeNote(activeNote.id).then((result) => {
        const summaryNodes = [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Summary" }] },
          { type: "paragraph", content: [{ type: "text", text: result.result }] },
        ];
        saveMutation.mutate({ content: appendNodes(activeNote.content, summaryNodes) });
      });
      return;
    }

    if (command.commandType === "generate_questions") {
      setAiInitial({ panel: "quiz", questionCount: command.questionCount || 5 });
      setAiOpen(true);
    }
  }

  const showEditorPane = !!selectedNoteId && !!activeNote;

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-8rem)]">
      {!focusMode && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-h1 text-fg">Notes</h1>
            <p className="mt-1 text-label text-fg-muted">Capture ideas, prep, and research — organized and searchable.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSpeak(true)}
              className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3.5 py-2 text-caption font-medium text-fg transition-colors hover:bg-fg/[0.05]"
            >
              <Mic className="h-3.5 w-3.5" /> Speak
            </button>
            <button
              type="button"
              onClick={() => createNoteMutation.mutate()}
              disabled={createNoteMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-3.5 py-2 text-caption font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" /> New note
            </button>
          </div>
        </div>
      )}

      <div className={cn("grid flex-1 gap-4 overflow-hidden", focusMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[220px_320px_1fr]")}>
        {!focusMode && (
          <div className={cn("overflow-hidden rounded-2xl surface-2 surface-edge lg:block", showEditorPane ? "hidden" : "block")}>
            <div className="h-full overflow-y-auto p-3">
              <NotesSidebar
                view={view}
                onViewChange={setView}
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
                onCreateFolder={(name) => createFolderMutation.mutate(name)}
                onDeleteFolder={(id) => deleteFolderMutation.mutate(id)}
                tags={tags}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
                dueFlashcardCount={dueCount}
                onOpenReview={() => setReviewOpen(true)}
              />
            </div>
          </div>
        )}

        {!focusMode && (
          <div className={cn("overflow-hidden rounded-2xl surface-2 surface-edge lg:flex lg:flex-col", showEditorPane ? "hidden" : "flex flex-col")}>
            <NotesList
              view={view}
              notes={notes}
              notesLoading={notesLoading}
              folders={folders}
              selectedNoteId={selectedNoteId}
              onSelectNote={setSelectedNoteId}
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              searchQuery={searchQuery}
              searching={searching}
              searchResults={searchResults}
              filters={filters}
              onFiltersChange={setFilters}
              onTogglePin={(id, pinned) => patchMutation.mutate({ id, input: { pinned } })}
              onDuplicate={(id) => duplicateMutation.mutate(id)}
              onMoveToFolder={(id, folderId) => patchMutation.mutate({ id, input: { folderId } })}
              onArchiveToggle={handleArchiveToggle}
              onDelete={(id) => trashMutation.mutate(id)}
              onRestore={(id) => restoreMutation.mutate(id)}
              onPermanentDelete={(id) => setConfirmPermanentDeleteId(id)}
            />
          </div>
        )}

        <div className={cn("overflow-hidden rounded-2xl surface-1 surface-edge lg:flex lg:flex-col", showEditorPane ? "flex flex-col" : "hidden")}>
          {selectedNoteId && activeNote ? (
            <NoteEditor
              note={activeNote}
              saveState={saveState}
              titleDraft={titleDraft}
              onTitleChange={setTitleDraft}
              onContentChange={handleContentChange}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onBack={() => setSelectedNoteId(null)}
              onOpenInfo={() => setInfoOpen(true)}
              onOpenAI={() => {
                setAiInitial({ panel: "menu", questionCount: 5 });
                setAiOpen(true);
              }}
              onDelete={() => trashMutation.mutate(activeNote.id)}
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode((f) => !f)}
            />
          ) : (
            <EmptyState
              className="h-full justify-center border-none"
              icon={<Notebook className="h-8 w-8 text-fg-subtle" />}
              title="Pick a note, or start a new one"
              description="Write, paste, or speak something — Believe.ai will help organize it."
            />
          )}
        </div>
      </div>

      {showSpeak && (
        <SpeakToNote
          onClose={() => setShowSpeak(false)}
          hasActiveNote={!!activeNote}
          onCommand={handleVoiceCommand}
          onInsert={({ title, content }) => {
            void createNote({ title, content, folderId: selectedFolderId }).then((note) => {
              void queryClient.invalidateQueries({ queryKey: ["notes"] });
              setView("all");
              setSelectedNoteId(note.id);
              setShowSpeak(false);
            });
          }}
        />
      )}

      {activeNote && (
        <NoteAISuggestions
          note={activeNote}
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          initialPanel={aiInitial.panel}
          initialQuestionCount={aiInitial.questionCount}
        />
      )}

      {activeNote && <NoteInfoDrawer note={activeNote} folders={folders} open={infoOpen} onClose={() => setInfoOpen(false)} />}

      {reviewOpen && (
        <ReviewModal
          onClose={() => {
            setReviewOpen(false);
            void queryClient.invalidateQueries({ queryKey: ["dueFlashcardCount"] });
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmPermanentDeleteId}
        title="Delete permanently?"
        description="This note will be gone for good — this can't be undone."
        confirmLabel="Delete permanently"
        destructive
        busy={permanentDeleteMutation.isPending}
        onConfirm={() => confirmPermanentDeleteId && permanentDeleteMutation.mutate(confirmPermanentDeleteId)}
        onCancel={() => setConfirmPermanentDeleteId(null)}
      />
    </div>
  );
}

const GRADE_BUTTONS: { grade: ReviewGrade; label: string; className: string }[] = [
  { grade: "again", label: "Again", className: "bg-critical/10 text-critical hover:bg-critical/20" },
  { grade: "hard", label: "Hard", className: "bg-caution/10 text-caution hover:bg-caution/20" },
  { grade: "good", label: "Good", className: "bg-accent-soft text-accent hover:bg-accent/20" },
  { grade: "easy", label: "Easy", className: "bg-positive/10 text-positive hover:bg-positive/20" },
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
    <AnimatePresence>
      <div className={cn("fixed inset-0 flex items-center justify-center p-4", Z.overlay)} role="dialog" aria-modal="true">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-fg/40" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-card surface-4 surface-edge p-6 shadow-lift"
        >
          <p className="mb-4 text-h3 text-fg">Review</p>
          {isLoading ? (
            <Spinner className="mx-auto h-5 w-5 text-fg-subtle" />
          ) : !cards || cards.length === 0 ? (
            <p className="text-label text-fg-subtle">No cards due for review right now — nice work.</p>
          ) : !current ? (
            <div className="py-6 text-center">
              <Check className="mx-auto h-8 w-8 text-positive" />
              <p className="mt-2 text-label font-medium text-fg">All done for now.</p>
              <p className="text-caption text-fg-subtle">Come back later for the next batch.</p>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-caption text-fg-subtle">
                {index + 1} of {cards.length} · {current.noteTitle}
              </p>
              <button
                type="button"
                onClick={() => setShowBack((s) => !s)}
                className="flex min-h-[140px] w-full items-center justify-center rounded-2xl surface-2 surface-edge p-6 text-center text-label font-medium text-fg"
              >
                {showBack ? current.back : current.front}
              </button>
              <p className="mt-2 text-center text-caption text-fg-subtle">{showBack ? "Answer — tap to flip back" : "Tap to reveal the answer"}</p>

              {showBack && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {GRADE_BUTTONS.map(({ grade, label, className }) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => gradeMutation.mutate(grade)}
                      disabled={gradeMutation.isPending}
                      className={cn("rounded-lg px-2 py-2 text-caption font-semibold transition-colors disabled:opacity-50", className)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button type="button" onClick={onClose} className="mt-5 text-caption font-medium text-fg-subtle hover:text-fg">
            Close
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
