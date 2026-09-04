import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Pin, X } from "lucide-react";
import { Spinner } from "../../components/ui/Spinner.js";
import { Z } from "../../lib/zIndex.js";
import { cn } from "../../lib/cn.js";
import { fetchNote, updateNote } from "../notes/notesApi.js";
import { FloatingNoteEditor } from "./FloatingNoteEditor.js";
import { useFloatingNotesStore, type FloatEntry } from "./floatingNotesStore.js";

/** Floating Note's mobile treatment — a compact chip bar instead of draggable
 * desktop cards, each opening a full-width bottom sheet on tap. Desktop's
 * <FloatWidget/> is hidden below the `sm` breakpoint; this is its only
 * counterpart there. */
export function MobileQuickNoteSheet({ floats }: { floats: FloatEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (floats.length === 0) return null;
  const openEntry = floats.find((f) => f.noteId === openId);

  return (
    <div className="sm:hidden">
      <div className={cn("fixed inset-x-0 bottom-0 flex gap-2 overflow-x-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2", Z.floatingNote)}>
        {floats.map((entry) => (
          <NoteChip key={entry.noteId} noteId={entry.noteId} onOpen={() => setOpenId(entry.noteId)} />
        ))}
      </div>

      <AnimatePresence>{openEntry && <MobileSheet entry={openEntry} onClose={() => setOpenId(null)} />}</AnimatePresence>
    </div>
  );
}

function NoteChip({ noteId, onOpen }: { noteId: string; onOpen: () => void }) {
  const { data: note } = useQuery({ queryKey: ["note", noteId], queryFn: () => fetchNote(noteId) });
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-pill surface-3 surface-edge px-3 py-2 text-caption font-medium text-fg shadow-lift backdrop-blur-md"
    >
      <Pin className="h-3 w-3 text-accent" />
      <span className="max-w-[120px] truncate">{note?.title || "Untitled note"}</span>
    </button>
  );
}

function MobileSheet({ entry, onClose }: { entry: FloatEntry; onClose: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unfloat = useFloatingNotesStore((s) => s.unfloat);
  const { data: note } = useQuery({ queryKey: ["note", entry.noteId], queryFn: () => fetchNote(entry.noteId) });

  const updateMutation = useMutation({
    mutationFn: (content: Record<string, unknown>) => updateNote(entry.noteId, { content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["note", entry.noteId] });
    },
  });

  return (
    <div className={cn("fixed inset-0 flex items-end", Z.overlay)} role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-fg/40" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative flex max-h-[75vh] w-full flex-col rounded-t-2xl surface-3 surface-edge pb-[env(safe-area-inset-bottom)] shadow-lift backdrop-blur-md"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-3">
          <Pin className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="flex-1 truncate text-label font-semibold text-fg">{note?.title || "Untitled note"}</span>
          <button type="button" onClick={() => unfloat(entry.noteId)} className="text-fg-muted hover:text-critical" title="Close (keeps the note)">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-surface px-4 py-3">
          {!note ? <Spinner className="mx-auto h-5 w-5 text-fg-subtle" /> : <FloatingNoteEditor content={note.content} onChange={(c) => updateMutation.mutate(c)} />}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(`/app/notes?note=${entry.noteId}`)}
            className="inline-flex items-center gap-1 text-caption font-medium text-fg-muted hover:text-fg"
          >
            Open in Notes <ExternalLink className="h-3 w-3" />
          </button>
          <button type="button" onClick={onClose} className="rounded-pill bg-accent px-3.5 py-1.5 text-caption font-semibold text-accent-fg">
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
