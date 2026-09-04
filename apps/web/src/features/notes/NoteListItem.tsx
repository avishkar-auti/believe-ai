import { Copy, FolderInput, MoreHorizontal, Pin, PinOff, RotateCcw, Trash2 } from "lucide-react";
import type { NoteFolder, NoteSummary } from "@believe-ai/shared";
import { Menu, type MenuItemDef } from "../../components/ui/Menu.js";
import { cn } from "../../lib/cn.js";

function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

interface NoteListItemProps {
  note: NoteSummary;
  active: boolean;
  trashed: boolean;
  folders: NoteFolder[] | undefined;
  onClick: () => void;
  onTogglePin: () => void;
  onDuplicate: () => void;
  onMoveToFolder: (folderId: string | null) => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

/** A single row in the notes list — title, preview, tags, and the "edited
 * X ago" metadata line, per §3 of the redesign brief. Hover reveals a pin
 * shortcut and the full action menu; no heavy shadow, no oversized card. */
export function NoteListItem({
  note,
  active,
  trashed,
  folders,
  onClick,
  onTogglePin,
  onDuplicate,
  onMoveToFolder,
  onArchiveToggle,
  onDelete,
  onRestore,
  onPermanentDelete,
}: NoteListItemProps) {
  const meta = [note.tags.length > 0 ? note.tags.join(" · ") : null, `Edited ${timeAgo(note.updatedAt)}`].filter(Boolean).join(" — ");

  const menuItems: MenuItemDef[] = trashed
    ? [
        { id: "restore", label: "Restore", icon: RotateCcw, onSelect: onRestore },
        { id: "delete-forever", label: "Delete permanently", icon: Trash2, danger: true, onSelect: onPermanentDelete },
      ]
    : [
        { id: "pin", label: note.pinned ? "Unpin" : "Pin", icon: note.pinned ? PinOff : Pin, onSelect: onTogglePin },
        { id: "duplicate", label: "Duplicate", icon: Copy, onSelect: onDuplicate },
        ...(folders && folders.length > 0
          ? folders
              .filter((f) => f.id !== note.folderId)
              .map((f) => ({ id: `move-${f.id}`, label: `Move to ${f.name}`, icon: FolderInput, onSelect: () => onMoveToFolder(f.id) }))
          : []),
        ...(note.folderId ? [{ id: "unfile", label: "Remove from folder", icon: FolderInput, onSelect: () => onMoveToFolder(null) }] : []),
        { id: "archive", label: note.archived ? "Unarchive" : "Archive", icon: FolderInput, onSelect: onArchiveToggle },
        { id: "delete", label: "Move to trash", icon: Trash2, danger: true, onSelect: onDelete },
      ];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "group relative flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2.5 text-left transition-colors",
        active ? "bg-accent-soft" : "hover:bg-fg/[0.04]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {note.pinned && <Pin className="h-3 w-3 shrink-0 text-accent" />}
          <p className={cn("truncate text-label font-medium", active ? "text-accent" : "text-fg")}>{note.title || "Untitled note"}</p>
        </div>
        {note.preview && <p className="mt-0.5 line-clamp-1 text-caption text-fg-muted">{note.preview}</p>}
        {meta && <p className="mt-1 truncate text-caption text-fg-subtle">{meta}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {!trashed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            title={note.pinned ? "Unpin" : "Pin"}
            className={cn("rounded-lg p-1.5 hover:bg-fg/[0.08]", note.pinned ? "text-accent" : "text-fg-subtle")}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        )}
        <Menu
          trigger={
            <button
              type="button"
              aria-label="More actions"
              title="More"
              className="rounded-lg p-1.5 text-fg-subtle hover:bg-fg/[0.08] hover:text-fg"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          }
          items={menuItems}
        />
      </div>
    </div>
  );
}
