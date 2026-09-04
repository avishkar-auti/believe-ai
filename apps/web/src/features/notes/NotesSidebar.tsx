import { useState, type FormEvent } from "react";
import type { NoteFolder } from "@believe-ai/shared";
import { Archive, FolderPlus, Notebook, Pin, RotateCcw, Tag, Trash2 } from "lucide-react";
import { cn } from "../../lib/cn.js";

export type NotesView = "all" | "pinned" | "recent" | "archived" | "trash";

interface NotesSidebarProps {
  view: NotesView;
  onViewChange: (view: NotesView) => void;
  folders: NoteFolder[] | undefined;
  selectedFolderId: string | undefined;
  onSelectFolder: (id: string | undefined) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  tags: string[] | undefined;
  selectedTag: string | undefined;
  onSelectTag: (tag: string | undefined) => void;
  dueFlashcardCount: number | undefined;
  onOpenReview: () => void;
}

function NavItem({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: typeof Notebook;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-label transition-colors",
        active ? "bg-accent-soft text-accent" : "text-fg-muted hover:bg-fg/[0.05] hover:text-fg",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-pill bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-fg">{count}</span>
      )}
    </button>
  );
}

/** Compact left rail: main views, folders, tags, and the trash/archive pair
 * at the bottom — deliberately not overcrowded (§2 of the redesign brief). */
export function NotesSidebar({
  view,
  onViewChange,
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  tags,
  selectedTag,
  onSelectTag,
  dueFlashcardCount,
  onOpenReview,
}: NotesSidebarProps) {
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");

  function submitFolder(e: FormEvent) {
    e.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    onCreateFolder(name);
    setFolderName("");
    setCreatingFolder(false);
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-4 overflow-y-auto">
        <div className="space-y-0.5">
          <NavItem active={view === "all"} icon={Notebook} label="All Notes" onClick={() => onViewChange("all")} />
          <NavItem active={view === "pinned"} icon={Pin} label="Pinned" onClick={() => onViewChange("pinned")} />
          <NavItem active={view === "recent"} icon={RotateCcw} label="Recent" onClick={() => onViewChange("recent")} />
        </div>

        {!!dueFlashcardCount && dueFlashcardCount > 0 && (
          <button
            type="button"
            onClick={onOpenReview}
            className="flex w-full items-center justify-between gap-2 rounded-lg bg-accent-soft px-3 py-1.5 text-label font-medium text-accent"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5" /> Review
            </span>
            <span className="rounded-pill bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-fg">{dueFlashcardCount}</span>
          </button>
        )}

        {folders && folders.length > 0 && (
          <div>
            <p className="px-3 pb-1 text-section uppercase text-fg-subtle">Folders</p>
            <div className="space-y-0.5">
              {folders.map((f) => (
                <div key={f.id} className="group flex items-center">
                  <button
                    type="button"
                    onClick={() => onSelectFolder(selectedFolderId === f.id ? undefined : f.id)}
                    className={cn(
                      "flex-1 truncate rounded-lg px-3 py-1.5 text-left text-label transition-colors",
                      selectedFolderId === f.id ? "bg-accent-soft text-accent" : "text-fg-muted hover:bg-fg/[0.05] hover:text-fg",
                    )}
                  >
                    {f.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFolder(f.id)}
                    aria-label={`Delete ${f.name}`}
                    className="hidden shrink-0 rounded-lg p-1.5 text-fg-subtle hover:text-critical group-hover:block"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {creatingFolder ? (
          <form onSubmit={submitFolder} className="px-1">
            <input
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onBlur={() => !folderName.trim() && setCreatingFolder(false)}
              placeholder="Folder name"
              className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-label text-fg outline-none focus:border-accent"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCreatingFolder(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-label text-fg-subtle hover:text-fg"
          >
            <FolderPlus className="h-3.5 w-3.5" /> New folder
          </button>
        )}

        {tags && tags.length > 0 && (
          <div>
            <p className="px-3 pb-1 text-section uppercase text-fg-subtle">Tags</p>
            <div className="flex flex-wrap gap-1.5 px-1">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSelectTag(selectedTag === t ? undefined : t)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-caption font-medium transition-colors",
                    selectedTag === t ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-muted hover:text-fg",
                  )}
                >
                  <Tag className="h-2.5 w-2.5" /> {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-0.5 border-t border-line pt-2">
        <NavItem active={view === "archived"} icon={Archive} label="Archived" onClick={() => onViewChange("archived")} />
        <NavItem active={view === "trash"} icon={Trash2} label="Trash" onClick={() => onViewChange("trash")} />
      </div>
    </div>
  );
}
