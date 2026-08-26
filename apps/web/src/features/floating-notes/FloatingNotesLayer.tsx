import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, GripHorizontal, Minus, Pin, Sparkles, X } from "lucide-react";
import { Spinner } from "../../components/ui/Spinner.js";
import { NoteEditor } from "../notes/NoteEditor.js";
import { fetchNote, summarizeNote, updateNote } from "../notes/notesApi.js";
import { extractPreviewText } from "./extractPreviewText.js";
import { useFloatingNotesStore, type FloatEntry } from "./floatingNotesStore.js";

/** Always-mounted alongside <CommandPalette/> at the app shell (DashboardLayout),
 * outside the routed <Outlet/> — so it survives client-side navigation exactly
 * the way CommandPalette does, per the plan's audit. Each widget is freely
 * positioned (not stacked) so it can be dragged anywhere on screen. */
export function FloatingNotesLayer() {
  const floats = useFloatingNotesStore((s) => s.floats);
  if (floats.length === 0) return null;

  return (
    <>
      {floats.map((entry) => (
        <FloatWidget key={entry.noteId} entry={entry} />
      ))}
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

function FloatWidget({ entry }: { entry: FloatEntry }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unfloat = useFloatingNotesStore((s) => s.unfloat);
  const setMode = useFloatingNotesStore((s) => s.setMode);
  const move = useFloatingNotesStore((s) => s.move);
  const [summary, setSummary] = useState<string | null>(null);

  const { data: note } = useQuery({ queryKey: ["note", entry.noteId], queryFn: () => fetchNote(entry.noteId) });

  const { position, startDrag, consumeWasDragged } = useDrag(entry.x, entry.y, (x, y) => move(entry.noteId, x, y));

  const updateMutation = useMutation({
    mutationFn: (content: Record<string, unknown>) => updateNote(entry.noteId, { content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["note", entry.noteId] });
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: () => summarizeNote(entry.noteId),
    onSuccess: (result) => setSummary(result.result),
  });

  function openFull() {
    navigate(`/app/notes?note=${entry.noteId}`);
  }

  if (!note) {
    return (
      <div
        className="fixed z-40 flex w-72 items-center justify-center rounded-2xl border border-ink-100 bg-white p-4 shadow-lift dark:border-ink-700 dark:bg-ink-800"
        style={{ left: position.x, top: position.y }}
      >
        <Spinner className="h-4 w-4 text-ink-400" />
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
        className="fixed z-40 flex cursor-grab select-none items-center gap-2 rounded-pill border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 shadow-lift active:cursor-grabbing dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
        style={{ left: position.x, top: position.y }}
      >
        <Pin className="h-3 w-3 text-brand-500" />
        <span className="max-w-[140px] truncate">{note.title || "Untitled note"}</span>
      </button>
    );
  }

  return (
    <div
      className="fixed z-40 w-72 rounded-2xl border border-ink-100 bg-white shadow-lift dark:border-ink-700 dark:bg-ink-800"
      style={{ left: position.x, top: position.y }}
    >
      <div
        onPointerDown={startDrag}
        className="flex cursor-grab select-none items-center gap-2 border-b border-ink-100 px-3 py-2 active:cursor-grabbing dark:border-ink-700"
      >
        <GripHorizontal className="h-3.5 w-3.5 shrink-0 text-ink-300" />
        <Pin className="h-3.5 w-3.5 shrink-0 text-brand-500" />
        <span className="flex-1 truncate text-sm font-semibold text-ink-900 dark:text-white">{note.title || "Untitled note"}</span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setMode(entry.noteId, "minimized")}
          className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-100"
          title="Minimize"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => unfloat(entry.noteId)}
          className="text-ink-400 hover:text-red-500"
          title="Unfloat"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto px-3 py-2.5">
        {entry.mode === "expanded" ? (
          <div className="text-xs [&_.ProseMirror]:min-h-[80px]">
            <NoteEditor
              key={entry.noteId}
              noteId={entry.noteId}
              content={note.content}
              onChange={(content) => updateMutation.mutate(content)}
            />
          </div>
        ) : (
          <p className="line-clamp-4 text-xs leading-5 text-ink-600 dark:text-ink-300">
            {extractPreviewText(note.content) || "This note is empty."}
          </p>
        )}

        {entry.mode === "expanded" && (
          <div className="mt-2 border-t border-ink-100 pt-2 dark:border-ink-700">
            {summary ? (
              <p className="rounded-lg bg-brand-50 p-2 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{summary}</p>
            ) : (
              <button
                type="button"
                onClick={() => summarizeMutation.mutate()}
                disabled={summarizeMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-300"
              >
                <Sparkles className="h-3 w-3" /> {summarizeMutation.isPending ? "Summarizing…" : "Summarize"}
              </button>
            )}
            {summarizeMutation.isError && <p className="mt-1 text-xs text-red-500">Couldn't summarize — try again.</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-ink-100 px-3 py-2 dark:border-ink-700">
        {entry.mode !== "expanded" && (
          <button
            type="button"
            onClick={() => setMode(entry.noteId, "expanded")}
            className="text-xs font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"
          >
            Expand
          </button>
        )}
        <button
          type="button"
          onClick={openFull}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"
        >
          Open <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
