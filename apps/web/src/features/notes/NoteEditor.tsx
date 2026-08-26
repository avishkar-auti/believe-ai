import "katex/dist/katex.min.css";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Mathematics from "@tiptap/extension-mathematics";
import {
  BookOpen,
  Grid3x3,
  Image as ImageIcon,
  ListChecks,
  Loader2,
  Pin,
  Sigma,
  Sparkles,
  SpellCheck2,
  Wand2,
} from "lucide-react";
import type { NoteTransformAction } from "@believe-ai/shared";
import { transformNoteText, uploadAttachment, attachmentUrl } from "./notesApi.js";
import { useFloatingNotesStore } from "../floating-notes/floatingNotesStore.js";
import { ResizableImage } from "./ResizableImage.js";

const AI_ACTIONS: { action: NoteTransformAction; label: string; icon: typeof Sparkles }[] = [
  { action: "explain", label: "Explain", icon: BookOpen },
  { action: "simplify", label: "Simplify", icon: Wand2 },
  { action: "summarize", label: "Summarize", icon: Sparkles },
  { action: "fix_grammar", label: "Fix grammar", icon: SpellCheck2 },
];

export function NoteEditor({
  noteId,
  content,
  onChange,
}: {
  noteId: string;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}) {
  const [running, setRunning] = useState<NoteTransformAction | null>(null);
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFloated = useFloatingNotesStore((s) => s.floats.some((f) => f.noteId === noteId));
  const float = useFloatingNotesStore((s) => s.float);
  const unfloat = useFloatingNotesStore((s) => s.unfloat);

  async function insertImageAt(pos: number, file: File) {
    const uploaded = await uploadAttachment(noteId, file);
    editor?.chain().insertContentAt(pos, { type: "image", attrs: { src: attachmentUrl(noteId, uploaded.id) } }).run();
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Mathematics,
    ],
    content,
    onUpdate: ({ editor: ed }) => onChange(ed.getJSON()),
    editorProps: {
      attributes: { class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-1" },
      handleDrop: (view, event, _slice, moved) => {
        // `moved` is true for a drag that started inside this same editor (reordering
        // existing content) — only intercept drops bringing in outside files.
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        const pos = coords?.pos ?? view.state.selection.from;
        files.forEach((file, i) => void insertImageAt(pos + i, file));
        return true;
      },
    },
  });

  // The note being edited can change (switching notes in the list) without this
  // component remounting — resync the editor's document when that happens.
  useEffect(() => {
    if (editor && noteId) {
      const current = JSON.stringify(editor.getJSON());
      const incoming = JSON.stringify(content);
      if (current !== incoming) editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  async function runAiAction(action: NoteTransformAction) {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, " ");
    if (!selected.trim()) return;
    setRunning(action);
    try {
      const result = await transformNoteText(selected, action);
      editor.chain().focus().insertContentAt({ from, to }, result.result).run();
    } finally {
      setRunning(null);
    }
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const uploaded = await uploadAttachment(noteId, file);
    editor.chain().focus().setImage({ src: attachmentUrl(noteId, uploaded.id) }).run();
  }

  if (!editor) return null;

  return (
    <div className="relative">
      <BubbleMenu editor={editor} tippyOptions={{ duration: 120 }}>
        <div className="flex items-center gap-0.5 rounded-xl border border-ink-200 bg-white p-1 shadow-lift dark:border-ink-700 dark:bg-ink-800">
          {AI_ACTIONS.map(({ action, label, icon: Icon }) => (
            <button
              key={action}
              type="button"
              onClick={() => void runAiAction(action)}
              disabled={running !== null}
              title={label}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-50 dark:text-ink-300 dark:hover:bg-ink-700"
            >
              {running === action ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
              {label}
            </button>
          ))}
        </div>
      </BubbleMenu>

      <div className="mb-2 flex flex-wrap items-center gap-1 border-b border-ink-100 pb-2 dark:border-ink-700">
        <ToolbarButton label="Table" icon={Grid3x3} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
        <ToolbarButton label="Checklist" icon={ListChecks} onClick={() => editor.chain().focus().toggleTaskList().run()} />
        <ToolbarButton label="Image" icon={ImageIcon} onClick={() => fileInputRef.current?.click()} />
        <ToolbarButton
          label={isFloated ? "Floating" : "Float"}
          icon={Pin}
          onClick={() => (isFloated ? unfloat(noteId) : float(noteId))}
          active={isFloated}
        />
        <span className="ml-1 inline-flex items-center gap-1 text-xs text-ink-400" title="Type $x^2$ for inline math, $$...$$ for a block">
          <Sigma className="h-3.5 w-3.5" /> LaTeX: $...$
        </span>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImagePick(e)} />
      </div>

      <div
        onDragEnter={(e) => {
          if (e.dataTransfer.types.includes("Files")) setDraggingOver(true);
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) e.preventDefault();
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDraggingOver(false);
        }}
        onDrop={() => setDraggingOver(false)}
        className={draggingOver ? "rounded-xl outline-dashed outline-2 outline-brand-500 outline-offset-4" : undefined}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  active,
}: {
  label: string;
  icon: typeof Grid3x3;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-lg bg-brand-500/10 px-2.5 py-1.5 text-xs font-medium text-brand-600 transition-colors dark:text-brand-300"
          : "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"
      }
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
