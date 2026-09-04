import "katex/dist/katex.min.css";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ArrowLeft,
  Bold,
  Check,
  CheckSquare,
  Code,
  Expand,
  ExternalLink,
  Grid3x3,
  Heading2,
  Image as ImageIcon,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  MoreHorizontal,
  Pin,
  Quote,
  Sparkles,
  X,
} from "lucide-react";
import type { Note, NoteTransformAction } from "@believe-ai/shared";
import { transformNoteText, uploadAttachment, attachmentUrl } from "./notesApi.js";
import { useFloatingNotesStore } from "../floating-notes/floatingNotesStore.js";
import { ResizableImage } from "./ResizableImage.js";
import { Menu, type MenuItemDef } from "../../components/ui/Menu.js";
import { cn } from "../../lib/cn.js";
import { Z } from "../../lib/zIndex.js";

interface NoteEditorProps {
  note: Note;
  saveState: "idle" | "saving" | "saved";
  titleDraft: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: Record<string, unknown>) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onBack: () => void;
  onOpenInfo: () => void;
  onOpenAI: () => void;
  onDelete: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

const AI_ACTIONS: { action: NoteTransformAction; label: string }[] = [
  { action: "explain", label: "Explain" },
  { action: "simplify", label: "Shorten" },
  { action: "generate_example", label: "Expand" },
  { action: "summarize", label: "Summarize" },
  { action: "fix_grammar", label: "Fix grammar" },
  { action: "extract_action_items", label: "Extract action items" },
];

const SLASH_COMMANDS = [
  { id: "text", label: "Text", hint: "Plain paragraph", run: (chain: ReturnType<typeof buildChain>) => chain.setParagraph().run() },
  { id: "h2", label: "Heading", hint: "Section heading", run: (chain: ReturnType<typeof buildChain>) => chain.setHeading({ level: 2 }).run() },
  { id: "bullet", label: "Bullet list", hint: "Simple list", run: (chain: ReturnType<typeof buildChain>) => chain.toggleBulletList().run() },
  { id: "checklist", label: "Checklist", hint: "Track to-dos", run: (chain: ReturnType<typeof buildChain>) => chain.toggleTaskList().run() },
  { id: "quote", label: "Quote", hint: "Callout text", run: (chain: ReturnType<typeof buildChain>) => chain.toggleBlockquote().run() },
  { id: "code", label: "Code", hint: "Code block", run: (chain: ReturnType<typeof buildChain>) => chain.toggleCodeBlock().run() },
  { id: "divider", label: "Divider", hint: "Horizontal rule", run: (chain: ReturnType<typeof buildChain>) => chain.setHorizontalRule().run() },
];

function buildChain(editor: ReturnType<typeof useEditor>) {
  return editor!.chain().focus();
}

/**
 * The full editing surface — title, tags, linked-context indicator, and the
 * TipTap content area, all on one calm page rather than nested in a card
 * (§8). Formatting and AI live in a single selection toolbar; block types are
 * also reachable via "/" at the start of an empty line (§12-13).
 */
export function NoteEditor({
  note,
  saveState,
  titleDraft,
  onTitleChange,
  onContentChange,
  onAddTag,
  onRemoveTag,
  onBack,
  onOpenInfo,
  onOpenAI,
  onDelete,
  focusMode,
  onToggleFocusMode,
}: NoteEditorProps) {
  const [newTag, setNewTag] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [preview, setPreview] = useState<{ action: NoteTransformAction; original: string; suggested: string; from: number; to: number } | null>(
    null,
  );
  const [running, setRunning] = useState<NoteTransformAction | null>(null);
  const [draggingOver, setDraggingOver] = useState(false);
  const [slashMenu, setSlashMenu] = useState<{ x: number; y: number; from: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const isFloated = useFloatingNotesStore((s) => s.floats.some((f) => f.noteId === note.id));
  const float = useFloatingNotesStore((s) => s.float);
  const unfloat = useFloatingNotesStore((s) => s.unfloat);

  async function insertImageAt(pos: number, file: File) {
    const uploaded = await uploadAttachment(note.id, file);
    editor?.chain().insertContentAt(pos, { type: "image", attrs: { src: attachmentUrl(note.id, uploaded.id) } }).run();
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
    content: note.content,
    onUpdate: ({ editor: ed }) => {
      onContentChange(ed.getJSON());
      const { $from } = ed.state.selection;
      const atLineStart = $from.parentOffset === 1 && $from.parent.textContent === "/";
      if (atLineStart) {
        const coords = ed.view.coordsAtPos($from.pos);
        setSlashMenu({ x: coords.left, y: coords.bottom, from: $from.pos - 1 });
      } else if (slashMenu) {
        setSlashMenu(null);
      }
    },
    editorProps: {
      attributes: { class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[50vh]" },
      handleDrop: (view, event, _slice, moved) => {
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

  // Switching notes doesn't remount this component — resync the document.
  useEffect(() => {
    if (editor && note.id) {
      const current = JSON.stringify(editor.getJSON());
      const incoming = JSON.stringify(note.content);
      if (current !== incoming) editor.commands.setContent(note.content);
    }
    setPreview(null);
    setAiOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  async function runAiAction(action: NoteTransformAction) {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, " ");
    if (!selected.trim()) return;
    setAiOpen(false);
    setRunning(action);
    try {
      const result = await transformNoteText(selected, action);
      setPreview({ action, original: selected, suggested: result.result, from, to });
    } finally {
      setRunning(null);
    }
  }

  function applyPreview(mode: "replace" | "insert-below") {
    if (!editor || !preview) return;
    if (mode === "replace") {
      editor.chain().focus().insertContentAt({ from: preview.from, to: preview.to }, preview.suggested).run();
    } else {
      editor
        .chain()
        .focus()
        .insertContentAt(preview.to, { type: "paragraph", content: [{ type: "text", text: preview.suggested }] })
        .run();
    }
    setPreview(null);
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const uploaded = await uploadAttachment(note.id, file);
    editor.chain().focus().setImage({ src: attachmentUrl(note.id, uploaded.id) }).run();
  }

  const headerMenuItems: MenuItemDef[] = useMemo(
    () => [
      { id: "info", label: "Note info", icon: Info, onSelect: onOpenInfo },
      { id: "focus", label: focusMode ? "Exit focus mode" : "Focus mode", icon: Expand, onSelect: onToggleFocusMode },
      { id: "delete", label: "Move to trash", icon: X, danger: true, onSelect: onDelete },
    ],
    [focusMode, onDelete, onOpenInfo, onToggleFocusMode],
  );

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col surface-1">
      {/* Top bar — not part of the reading column, spans full width */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={onBack} aria-label="Back to notes" className="rounded-lg p-1.5 text-fg-muted hover:bg-fg/[0.06] hover:text-fg lg:hidden">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="truncate text-label font-medium text-fg-muted">{note.title || "Untitled"}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AnimatedSaveState state={saveState} />
          <button
            type="button"
            onClick={() => (isFloated ? unfloat(note.id) : float(note.id))}
            aria-label={isFloated ? "Note is floating" : "Float this note"}
            title={isFloated ? "Floating" : "Float note"}
            className={cn("rounded-lg p-1.5 transition-colors", isFloated ? "text-accent" : "text-fg-muted hover:bg-fg/[0.06] hover:text-fg")}
          >
            <Pin className="h-4 w-4" />
          </button>
          <Menu
            trigger={
              <button type="button" aria-label="Note actions" className="rounded-lg p-1.5 text-fg-muted hover:bg-fg/[0.06] hover:text-fg">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
            items={headerMenuItems}
          />
        </div>
      </div>

      {/* Reading column — 720–860px centered, per §9 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-6 py-10 sm:px-10">
          {note.linkedEntityLabel && (
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface-2 px-3 py-1 text-caption text-fg-muted">
              Linked to <span className="font-medium text-fg">{note.linkedEntityLabel}</span>
            </div>
          )}

          <textarea
            ref={titleRef}
            value={titleDraft}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled"
            rows={1}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
            className="block w-full resize-none overflow-hidden border-none bg-transparent text-h1 font-bold text-fg outline-none placeholder:text-fg-subtle"
          />

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {note.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-pill border border-line px-2.5 py-1 text-caption font-medium text-fg-muted">
                {t}
                <button type="button" onClick={() => onRemoveTag(t)} aria-label={`Remove tag ${t}`} className="text-fg-subtle hover:text-critical">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = newTag.trim();
                if (v && !note.tags.includes(v)) onAddTag(v);
                setNewTag("");
              }}
              className="inline-flex items-center"
            >
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="+ Add tag"
                className="w-24 border-none bg-transparent text-caption text-fg-muted outline-none placeholder:text-fg-subtle"
              />
            </form>
          </div>

          <div className="mt-6 relative">
            <BubbleMenu editor={editor} tippyOptions={{ duration: 120 }}>
              <div className={cn("flex items-center gap-0.5 rounded-xl surface-3 surface-edge p-1 shadow-lift", Z.menu)}>
                {!aiOpen ? (
                  <>
                    <FormatButton icon={Bold} label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} />
                    <FormatButton icon={Italic} label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} />
                    <FormatButton icon={Heading2} label="Heading" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} />
                    <FormatButton icon={List} label="Bullets" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} />
                    <FormatButton icon={ListOrdered} label="Numbered" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} />
                    <FormatButton icon={CheckSquare} label="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} />
                    <FormatButton icon={Quote} label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} />
                    <FormatButton icon={Code} label="Code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} />
                    <FormatButton
                      icon={Link2}
                      label="Link"
                      onClick={() => {
                        const url = window.prompt("Link URL");
                        if (url) editor.chain().focus().setLink({ href: url }).run();
                      }}
                      active={editor.isActive("link")}
                    />
                    <span className="mx-0.5 h-4 w-px bg-line" />
                    <FormatButton icon={Sparkles} label="Ask Believe AI" onClick={() => setAiOpen(true)} />
                  </>
                ) : (
                  AI_ACTIONS.map(({ action, label }) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => void runAiAction(action)}
                      disabled={running !== null}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-caption font-medium text-fg-muted transition-colors hover:bg-fg/[0.06] disabled:opacity-50"
                    >
                      {running === action ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      {label}
                    </button>
                  ))
                )}
              </div>
            </BubbleMenu>

            <div
              onDragEnter={(e) => e.dataTransfer.types.includes("Files") && setDraggingOver(true)}
              onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
              onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setDraggingOver(false)}
              onDrop={() => setDraggingOver(false)}
              className={draggingOver ? "rounded-xl outline-dashed outline-2 outline-accent outline-offset-4" : undefined}
            >
              <EditorContent editor={editor} />
            </div>

            {slashMenu && (
              <div
                className={cn("fixed w-52 overflow-hidden rounded-xl surface-3 surface-edge p-1 shadow-lift", Z.menu)}
                style={{ left: slashMenu.x, top: slashMenu.y }}
              >
                {SLASH_COMMANDS.map((cmd) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteRange({ from: slashMenu.from, to: slashMenu.from + 1 }).run();
                      cmd.run(buildChain(editor));
                      setSlashMenu(null);
                    }}
                    className="flex w-full flex-col items-start rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-fg/[0.06]"
                  >
                    <span className="text-label font-medium text-fg">{cmd.label}</span>
                    <span className="text-caption text-fg-subtle">{cmd.hint}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-1 text-caption text-fg-subtle">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-fg/[0.06] hover:text-fg">
              <ImageIcon className="h-3 w-3" /> Image
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-fg/[0.06] hover:text-fg"
            >
              <Grid3x3 className="h-3 w-3" /> Table
            </button>
            <span title="Type $x^2$ for inline math, $$...$$ for a block" className="px-1.5">
              LaTeX: $...$
            </span>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImagePick(e)} />
          </div>
        </div>
      </div>

      {preview && (
        <AiEditPreview
          preview={preview}
          onReplace={() => applyPreview("replace")}
          onInsertBelow={() => applyPreview("insert-below")}
          onTryAgain={() => void runAiAction(preview.action)}
          onDismiss={() => setPreview(null)}
        />
      )}

      {!focusMode && (
        <button
          type="button"
          onClick={onOpenAI}
          className="fixed bottom-6 right-6 inline-flex items-center gap-1.5 rounded-pill bg-accent px-4 py-2.5 text-label font-semibold text-accent-fg shadow-lift transition-transform hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" /> Ask Believe
        </button>
      )}
    </div>
  );
}

function AnimatedSaveState({ state }: { state: "idle" | "saving" | "saved" }) {
  if (state === "idle") return null;
  return (
    <span className={cn("text-caption transition-opacity duration-500", state === "saved" ? "text-fg-subtle opacity-70" : "text-fg-muted")}>
      {state === "saving" ? "Saving…" : (
        <span className="inline-flex items-center gap-1">
          <Check className="h-3 w-3" /> Saved
        </span>
      )}
    </span>
  );
}

function FormatButton({
  icon: IconCmp,
  label,
  onClick,
  active,
}: {
  icon: typeof Bold;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
        active ? "bg-accent-soft text-accent" : "text-fg-muted hover:bg-fg/[0.06] hover:text-fg",
      )}
    >
      <IconCmp className="h-3.5 w-3.5" />
    </button>
  );
}

function AiEditPreview({
  preview,
  onReplace,
  onInsertBelow,
  onTryAgain,
  onDismiss,
}: {
  preview: { action: NoteTransformAction; original: string; suggested: string };
  onReplace: () => void;
  onInsertBelow: () => void;
  onTryAgain: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className={cn("fixed inset-x-0 bottom-0 flex justify-center p-4", Z.overlay)}>
      <div className="w-full max-w-xl rounded-2xl surface-4 surface-edge p-4 shadow-lift">
        <div className="mb-3 flex items-center gap-1.5 text-label font-semibold text-fg">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> Believe AI suggestion
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-section uppercase text-fg-subtle">Original</p>
            <p className="mt-1 max-h-24 overflow-y-auto rounded-lg bg-fg/[0.04] p-2 text-caption text-fg-muted">{preview.original}</p>
          </div>
          <div>
            <p className="text-section uppercase text-fg-subtle">Suggested</p>
            <p className="mt-1 max-h-32 overflow-y-auto rounded-lg bg-accent-soft p-2 text-label text-fg">{preview.suggested}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={onReplace} className="rounded-pill bg-accent px-3 py-1.5 text-caption font-semibold text-accent-fg">
            Replace
          </button>
          <button type="button" onClick={onInsertBelow} className="inline-flex items-center gap-1 rounded-pill border border-line px-3 py-1.5 text-caption font-medium text-fg hover:bg-fg/[0.05]">
            <ExternalLink className="h-3 w-3" /> Insert below
          </button>
          <button type="button" onClick={onTryAgain} className="rounded-pill border border-line px-3 py-1.5 text-caption font-medium text-fg hover:bg-fg/[0.05]">
            Try again
          </button>
          <button type="button" onClick={onDismiss} className="ml-auto text-caption font-medium text-fg-subtle hover:text-fg">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
