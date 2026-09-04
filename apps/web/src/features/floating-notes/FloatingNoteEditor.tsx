import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useEffect } from "react";
import { Bold, CheckSquare, Italic, List } from "lucide-react";
import { cn } from "../../lib/cn.js";

interface FloatingNoteEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

/** A deliberately small editor for the floating widget — bold/italic/lists
 * only, no tables/images/math/slash-commands/AI toolbar. The full editing
 * surface lives in the workspace; this is quick capture, not a second copy
 * of it (§ Floating Note: "simplified core formatting only"). */
export function FloatingNoteEditor({ content, onChange }: FloatingNoteEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, TaskList, TaskItem.configure({ nested: true })],
    content,
    onUpdate: ({ editor: ed }) => onChange(ed.getJSON()),
    editorProps: {
      attributes: { class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[80px] text-label" },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(content);
    if (current !== incoming) editor.commands.setContent(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1.5 flex items-center gap-0.5 border-b border-line pb-1.5">
        <ToolButton icon={Bold} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="Bold" />
        <ToolButton icon={Italic} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic" />
        <ToolButton icon={List} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bullet list" />
        <ToolButton icon={CheckSquare} active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} label="Checklist" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, active, onClick, label }: { icon: typeof Bold; active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={cn("flex h-6 w-6 items-center justify-center rounded-md transition-colors", active ? "bg-accent-soft text-accent" : "text-fg-muted hover:bg-fg/[0.06] hover:text-fg")}
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}
