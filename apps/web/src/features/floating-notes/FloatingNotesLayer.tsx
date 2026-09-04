import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, GripHorizontal, Link2, Minus, Pin, RotateCcw, Sparkles, X } from "lucide-react";
import { Spinner } from "../../components/ui/Spinner.js";
import { Z } from "../../lib/zIndex.js";
import { cn } from "../../lib/cn.js";
import { createNote, fetchNote, summarizeNote, transformNoteText, updateNote } from "../notes/notesApi.js";
import { extractPlainText } from "./extractPreviewText.js";
import { FloatingNoteEditor } from "./FloatingNoteEditor.js";
import { MobileQuickNoteSheet } from "./MobileQuickNoteSheet.js";
import { clampSize, DEFAULT_HEIGHT, DEFAULT_WIDTH, useFloatingNotesStore, type FloatEntry } from "./floatingNotesStore.js";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

/** Real, route-derived context only — never inferred beyond what the URL
 * itself tells us. */
function detectRouteEntity(pathname: string): { type: string; id: string; label: string } | null {
  let m = pathname.match(/^\/app\/campaigns\/([^/]+)$/);
  if (m?.[1]) return { type: "campaign", id: m[1], label: "this campaign" };
  m = pathname.match(/^\/app\/interview-room\/([^/]+)/);
  if (m?.[1]) return { type: "interview", id: m[1], label: "this interview" };
  m = pathname.match(/^\/app\/design-studio\/([^/]+)$/);
  if (m?.[1]) return { type: "design_project", id: m[1], label: "this project" };
  return null;
}

/** Always-mounted alongside <CommandPalette/> at the app shell (DashboardLayout),
 * outside the routed <Outlet/> — so it survives client-side navigation exactly
 * the way CommandPalette does, per the plan's audit. Each widget is freely
 * positioned (not stacked) so it can be dragged anywhere on screen. Desktop
 * gets draggable/resizable cards; mobile gets a bottom-sheet variant instead
 * (see MobileQuickNoteSheet). */
export function FloatingNotesLayer() {
  const floats = useFloatingNotesStore((s) => s.floats);
  const float = useFloatingNotesStore((s) => s.float);
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        void createNote({ title: "", content: EMPTY_DOC }).then((note) => {
          void queryClient.invalidateQueries({ queryKey: ["notes"] });
          float(note.id);
        });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [float, queryClient]);

  if (floats.length === 0) return null;

  return (
    <>
      <div className="hidden sm:contents">
        {floats.map((entry) => (
          <FloatWidget key={entry.noteId} entry={entry} />
        ))}
      </div>
      <MobileQuickNoteSheet floats={floats} />
    </>
  );
}

// Distance (px) beyond which a pointer down-move-up sequence counts as a real drag
// rather than a click — below this, a slightly-shaky click shouldn't move the widget,
// and a real drag shouldn't also fire the click handler underneath the pointer.
const DRAG_THRESHOLD = 4;

function useDrag(x: number, y: number, onMove: (x: number, y: number) => void) {
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const draggedRef = useRef(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (!dragState.current) return;
      const { startX, startY, originX, originY } = dragState.current;
      if (Math.abs(e.clientX - startX) > DRAG_THRESHOLD || Math.abs(e.clientY - startY) > DRAG_THRESHOLD) {
        draggedRef.current = true;
      }
      const next = {
        x: Math.min(Math.max(0, originX + (e.clientX - startX)), window.innerWidth - 60),
        y: Math.min(Math.max(0, originY + (e.clientY - startY)), window.innerHeight - 40),
      };
      setDragPos(next);
    }
    function handlePointerUp() {
      if (dragState.current && dragPos && draggedRef.current) onMove(dragPos.x, dragPos.y);
      dragState.current = null;
      setDragPos(null);
    }
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragPos]);

  function startDrag(e: React.PointerEvent) {
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: x, originY: y };
  }

  // Consumed once per call — a click handler calls this to know whether the
  // pointerdown-up sequence it's reacting to was actually a drag, not a tap.
  function consumeWasDragged(): boolean {
    const was = draggedRef.current;
    draggedRef.current = false;
    return was;
  }

  return { position: dragPos ?? { x, y }, startDrag, consumeWasDragged };
}

function useResize(width: number, height: number, onResize: (width: number, height: number) => void) {
  const state = useRef<{ startX: number; startY: number; originW: number; originH: number } | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      if (!state.current) return;
      const { startX, startY, originW, originH } = state.current;
      setSize(clampSize(originW + (e.clientX - startX), originH + (e.clientY - startY)));
    }
    function handleUp() {
      if (state.current && size) onResize(size.width, size.height);
      state.current = null;
      setSize(null);
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  function startResize(e: React.PointerEvent) {
    e.stopPropagation();
    state.current = { startX: e.clientX, startY: e.clientY, originW: width, originH: height };
  }

  return { size: size ?? { width, height }, startResize };
}

type AiAction = "summarize" | "fix_grammar" | "extract_action_items";
const AI_POPOVER_ACTIONS: { action: AiAction; label: string }[] = [
  { action: "summarize", label: "Summarize" },
  { action: "fix_grammar", label: "Clean up" },
  { action: "extract_action_items", label: "Extract action items" },
];

function FloatWidget({ entry }: { entry: FloatEntry }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const unfloat = useFloatingNotesStore((s) => s.unfloat);
  const setMode = useFloatingNotesStore((s) => s.setMode);
  const move = useFloatingNotesStore((s) => s.move);
  const resize = useFloatingNotesStore((s) => s.resize);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiResult, setAiResult] = useState<{ action: AiAction; text: string } | null>(null);

  const { data: note } = useQuery({ queryKey: ["note", entry.noteId], queryFn: () => fetchNote(entry.noteId) });

  const { position, startDrag, consumeWasDragged } = useDrag(entry.x, entry.y, (x, y) => move(entry.noteId, x, y));
  const { size, startResize } = useResize(entry.width ?? DEFAULT_WIDTH, entry.height ?? DEFAULT_HEIGHT, (w, h) => resize(entry.noteId, w, h));

  const lastContentRef = useRef<Record<string, unknown> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateMutation = useMutation({
    mutationFn: (content: Record<string, unknown>) => updateNote(entry.noteId, { content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["note", entry.noteId] });
    },
  });

  const linkMutation = useMutation({
    mutationFn: (link: { type: string; id: string; label: string }) =>
      updateNote(entry.noteId, { linkedEntityType: link.type, linkedEntityId: link.id, linkedEntityLabel: link.label }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["note", entry.noteId] });
    },
  });

  const aiMutation = useMutation({
    mutationFn: async (action: AiAction) => {
      if (!note) return "";
      const text = action === "summarize" ? (await summarizeNote(note.id)).result : (await transformNoteText(extractPlainText(note.content), action)).result;
      return text;
    },
    onSuccess: (text, action) => setAiResult({ action, text }),
  });

  function handleContentChange(content: Record<string, unknown>) {
    lastContentRef.current = content;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => updateMutation.mutate(content), 500);
  }

  function retrySave() {
    if (lastContentRef.current) updateMutation.mutate(lastContentRef.current);
  }

  function insertAiResult() {
    if (!note || !aiResult) return;
    const heading = { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: aiResult.action === "extract_action_items" ? "Action items" : "Summary" }] };
    const existing = Array.isArray(note.content.content) ? (note.content.content as Record<string, unknown>[]) : [];
    updateMutation.mutate({ ...note.content, content: [...existing, heading, { type: "paragraph", content: [{ type: "text", text: aiResult.text }] }] });
    setAiResult(null);
    setAiOpen(false);
  }

  function openFull() {
    navigate(`/app/notes?note=${entry.noteId}`);
  }

  const routeEntity = detectRouteEntity(location.pathname);
  const showLinkSuggestion = !!routeEntity && note && note.linkedEntityId !== routeEntity.id;

  if (!note) {
    return (
      <div className={cn("fixed flex w-72 items-center justify-center rounded-2xl surface-3 surface-edge p-4 shadow-lift backdrop-blur-md", Z.floatingNote)} style={{ left: position.x, top: position.y }}>
        <Spinner className="h-4 w-4 text-fg-subtle" />
      </div>
    );
  }

  if (entry.mode === "minimized") {
    return (
      <button
        type="button"
        onPointerDown={startDrag}
        onClick={() => {
          if (!consumeWasDragged()) setMode(entry.noteId, "normal");
        }}
        className={cn(
          "fixed flex cursor-grab select-none items-center gap-2 rounded-pill surface-3 surface-edge px-3 py-2 text-caption font-medium text-fg shadow-lift backdrop-blur-md transition-transform active:cursor-grabbing",
          Z.floatingNote,
        )}
        style={{ left: position.x, top: position.y }}
      >
        <Pin className="h-3 w-3 text-accent" />
        <span className="max-w-[140px] truncate">{note.title || "Untitled note"}</span>
      </button>
    );
  }

  return (
    <div
      className={cn("fixed flex flex-col overflow-hidden rounded-2xl surface-3 surface-edge shadow-lift backdrop-blur-md", Z.floatingNote)}
      style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
    >
      <div onPointerDown={startDrag} className="flex shrink-0 cursor-grab select-none items-center gap-2 border-b border-line px-3 py-2 active:cursor-grabbing">
        <GripHorizontal className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
        <Pin className="h-3.5 w-3.5 shrink-0 text-accent" />
        <span className="flex-1 truncate text-label font-semibold text-fg">{note.title || "Untitled note"}</span>
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => setAiOpen((o) => !o)} className="text-fg-muted hover:text-accent" title="Ask Believe">
          <Sparkles className="h-3.5 w-3.5" />
        </button>
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => setMode(entry.noteId, "minimized")} className="text-fg-muted hover:text-fg" title="Minimize">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => unfloat(entry.noteId)} className="text-fg-muted hover:text-critical" title="Close (keeps the note)">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Opaque body — chrome above is translucent, the writing surface stays fully readable. */}
      <div className="flex-1 overflow-hidden bg-surface px-3 py-2.5">
        {aiOpen ? (
          <div className="flex h-full flex-col">
            {!aiResult ? (
              <div className="space-y-1">
                {AI_POPOVER_ACTIONS.map(({ action, label }) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => aiMutation.mutate(action)}
                    disabled={aiMutation.isPending}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-caption font-medium text-fg transition-colors hover:bg-fg/[0.05] disabled:opacity-50"
                  >
                    {label}
                    {aiMutation.isPending && aiMutation.variables === action && <Spinner className="h-3 w-3 text-fg-subtle" />}
                  </button>
                ))}
                {aiMutation.isError && <p className="px-2 pt-1 text-caption text-critical">Couldn't reach Believe AI — try again.</p>}
                <button type="button" onClick={() => setAiOpen(false)} className="mt-1 px-2 text-caption text-fg-subtle hover:text-fg">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <p className="flex-1 overflow-y-auto rounded-lg bg-accent-soft p-2 text-caption text-fg">{aiResult.text}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={insertAiResult} className="rounded-pill bg-accent px-2.5 py-1 text-caption font-semibold text-accent-fg">
                    Add to note
                  </button>
                  <button type="button" onClick={() => setAiResult(null)} className="text-caption font-medium text-fg-subtle hover:text-fg">
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <FloatingNoteEditor content={note.content} onChange={handleContentChange} />
        )}
      </div>

      {showLinkSuggestion && routeEntity && (
        <button
          type="button"
          onClick={() => linkMutation.mutate(routeEntity)}
          disabled={linkMutation.isPending}
          className="flex shrink-0 items-center gap-1.5 border-t border-line bg-accent-soft px-3 py-1.5 text-caption font-medium text-accent hover:bg-accent/20"
        >
          <Link2 className="h-3 w-3" /> Link to {routeEntity.label}
        </button>
      )}

      <div className="flex shrink-0 items-center gap-2 border-t border-line px-3 py-2">
        {updateMutation.isError ? (
          <button type="button" onClick={retrySave} className="inline-flex items-center gap-1 text-caption font-medium text-critical hover:underline">
            <RotateCcw className="h-3 w-3" /> Couldn't save — Retry
          </button>
        ) : (
          <span className="text-caption text-fg-subtle">{updateMutation.isPending ? "Saving…" : ""}</span>
        )}
        <button type="button" onClick={openFull} className="ml-auto inline-flex items-center gap-1 text-caption font-medium text-fg-muted hover:text-fg">
          Open in Notes <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      <div
        onPointerDown={startResize}
        className="absolute bottom-0.5 right-0.5 flex h-4 w-4 rotate-45 cursor-nwse-resize items-center justify-center text-fg-subtle/60 hover:text-fg-subtle"
        title="Resize"
      >
        <GripHorizontal className="h-3 w-3" />
      </div>
    </div>
  );
}
