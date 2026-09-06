import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import MonacoEditor from "@monaco-editor/react";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  TriangleAlert,
  Underline as UnderlineIcon,
  Undo2,
  WrapText,
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import type { TemplateVariableValues } from "@believe-ai/shared";
import { Tabs, type TabItem } from "../../components/ui/Tabs.js";
import { useTheme } from "../../app/providers/ThemeProvider.js";
import { cn } from "../../lib/cn.js";
import { previewTemplate } from "./templatesApi.js";
import { VariablePicker } from "./VariablePicker.js";
import { formatEmailHtml } from "./formatEmailHtml.js";
import { findUnresolved, usePersonalizationContext } from "./usePersonalization.js";

const MODE_TABS: TabItem[] = [
  { value: "write", label: "Write" },
  { value: "html", label: "HTML" },
  { value: "preview", label: "Preview" },
];

// A clearly-fake stand-in recipient, so Preview shows a finished email
// without a real contact selected. Sender variables are deliberately absent:
// the server fills those from the real profile (see the /templates/preview
// route), so Preview shows your actual name and links rather than a
// placeholder that hides an empty profile until send day.
const SAMPLE_RECIPIENT: TemplateVariableValues = {
  firstName: "Jordan",
  lastName: "Lee",
  fullName: "Jordan Lee",
  recipientEmail: "jordan.lee@example.com",
  company: "Acme Inc.",
  jobTitle: "Engineering Manager",
};

/** The Write / HTML / Preview email composer — used by both the Templates
 * page and the AI draft chat's live-draft column. Holds the canonical
 * content as a plain HTML string (`value`); Write mode is a TipTap view
 * over that string, HTML mode edits it directly as source, and Preview
 * calls the exact same /templates/preview endpoint the campaign flow's own
 * preview uses, so this can never show something different from what a
 * recipient actually gets. */
export function EmailBodyEditor({
  subject,
  value,
  onChange,
  minHeight = 260,
}: {
  subject: string;
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}) {
  const [mode, setMode] = useState<"write" | "html" | "preview">("write");
  // The rich editor emits HTML as one long line. HTML mode shows a
  // pretty-printed copy instead, held here rather than derived from `value`
  // on every render — re-formatting mid-keystroke would fight the cursor.
  const [htmlSource, setHtmlSource] = useState("");
  const { resolved } = useTheme();
  const lastEmitted = useRef(value);

  function changeMode(next: "write" | "html" | "preview") {
    // Re-seed from `value` on entry, so edits made in Write mode show up here
    // formatted rather than as whatever was last typed into Monaco.
    if (next === "html") setHtmlSource(formatEmailHtml(value));
    setMode(next);
  }

  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false })],
    content: value,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
        style: `min-height:${minHeight}px`,
      },
    },
  });

  // Resync the editor when `value` changes from outside this component
  // (e.g. an AI chat turn rewriting the draft, or switching in from HTML
  // mode) — but never while it's the source of its own last edit, or every
  // keystroke would fight the cursor position.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    editor.commands.setContent(value);
    lastEmitted.current = value;
  }, [editor, value]);

  const previewQuery = useQuery({
    queryKey: ["email-body-preview", subject, value],
    queryFn: () => previewTemplate({ subject, body: value, bodyFormat: "html", values: SAMPLE_RECIPIENT }),
    enabled: mode === "preview" && value.trim().length > 0,
  });

  // Warn while writing, never block: a profile field can be filled in later,
  // and the campaign launch check (campaign_service._assert_personalization_ready)
  // is the gate that actually stops a broken send going out.
  const personalization = usePersonalizationContext();
  const unresolved = findUnresolved([subject, value], SAMPLE_RECIPIENT, personalization.data).filter((u) => u.reason !== "recipient");

  return (
    <div className="overflow-hidden rounded-control border border-line">
      <div className="flex items-center justify-between border-b border-line bg-surface-2 px-2">
        <Tabs items={MODE_TABS} value={mode} onChange={(v) => changeMode(v as typeof mode)} ariaLabel="Email body editor mode" />
        {mode === "html" && (
          <button
            type="button"
            onClick={() => {
              const formatted = formatEmailHtml(htmlSource);
              setHtmlSource(formatted);
              onChange(formatted);
            }}
            className="my-1.5 flex items-center gap-1 rounded-lg px-2 py-1 text-caption text-fg-muted transition-colors hover:bg-fg/[0.06] hover:text-fg"
          >
            <WrapText className="h-3.5 w-3.5" /> Format
          </button>
        )}
        {mode === "write" && editor && (
          <div className="flex items-center gap-0.5 py-1.5">
            <ToolbarButton icon={Bold} label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolbarButton icon={Italic} label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolbarButton
              icon={UnderlineIcon}
              label="Underline"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
            <span className="mx-1 h-4 w-px bg-line" />
            <ToolbarButton
              icon={Heading1}
              label="Heading"
              active={editor.isActive("heading", { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            />
            <ToolbarButton
              icon={Heading2}
              label="Subheading"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            />
            <span className="mx-1 h-4 w-px bg-line" />
            <ToolbarButton icon={List} label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolbarButton
              icon={ListOrdered}
              label="Numbered list"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
            <ToolbarButton
              icon={Link2}
              label="Link"
              active={editor.isActive("link")}
              onClick={() => {
                const url = window.prompt("Link URL");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
            />
            <span className="mx-1 h-4 w-px bg-line" />
            <ToolbarButton icon={Undo2} label="Undo" onClick={() => editor.chain().focus().undo().run()} />
            <ToolbarButton icon={Redo2} label="Redo" onClick={() => editor.chain().focus().redo().run()} />
            <span className="mx-1 h-4 w-px bg-line" />
            <VariablePicker onInsert={(token) => editor?.chain().focus().insertContent(token).run()} />
          </div>
        )}
      </div>

      {mode === "write" && (
        <div className="cursor-text bg-surface px-3.5 py-3" onClick={() => editor?.chain().focus().run()}>
          <EditorContent editor={editor} />
        </div>
      )}

      {mode === "html" && (
        <div style={{ height: minHeight + 40 }}>
          <MonacoEditor
            language="html"
            value={htmlSource}
            theme={resolved === "dark" ? "vs-dark" : "light"}
            onChange={(v) => {
              setHtmlSource(v ?? "");
              onChange(v ?? "");
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              padding: { top: 12 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
              tabSize: 2,
            }}
          />
        </div>
      )}

      {mode === "preview" && (
        <div className="bg-surface px-3.5 py-3" style={{ minHeight }}>
          {!value.trim() ? (
            <p className="text-sm text-fg-subtle">Nothing to preview yet — write something first.</p>
          ) : previewQuery.isLoading ? (
            <p className="text-sm text-fg-subtle">Rendering preview…</p>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              // Safe: this HTML was rendered and sanitized server-side by the
              // same pipeline (services/email_content.py) that builds the
              // real outbound email — never raw, unreviewed user input.
              dangerouslySetInnerHTML={{ __html: previewQuery.data?.body ?? "" }}
            />
          )}
        </div>
      )}

      {unresolved.length > 0 && (
        <div className="flex items-start gap-2 border-t border-line bg-caution/5 px-3.5 py-2.5 text-caption text-fg-muted">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution" />
          <p>
            {unresolved.map((u) => `{{${u.key}}}`).join(", ")}{" "}
            {unresolved.some((u) => u.reason === "unknown") && unresolved.every((u) => u.reason === "unknown")
              ? "isn't a variable this app knows — check the spelling, or it will send as blank text."
              : "will send blank. "}
            {unresolved.some((u) => u.reason === "sender") && (
              <>
                Fill in{" "}
                <RouterLink to="/app/settings/profile" className="font-medium text-accent hover:underline">
                  your profile
                </RouterLink>{" "}
                and every template picks it up.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Bold;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
        active ? "bg-accent-soft text-accent" : "text-fg-muted hover:bg-fg/[0.06] hover:text-fg",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
