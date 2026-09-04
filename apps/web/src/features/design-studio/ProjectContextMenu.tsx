import { Copy, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Menu } from "../../components/ui/Menu.js";

export function ProjectContextMenu({
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <Menu
      trigger={
        <span
          role="button"
          tabIndex={0}
          aria-label="More actions"
          className="flex h-7 w-7 items-center justify-center rounded-pill text-fg-muted transition-colors hover:bg-surface-4 hover:text-fg"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </span>
      }
      items={[
        { id: "open", label: "Open project", icon: ExternalLink, onSelect: onOpen },
        { id: "rename", label: "Rename", icon: Pencil, onSelect: onRename },
        { id: "duplicate", label: "Duplicate", icon: Copy, onSelect: onDuplicate },
        { id: "delete", label: "Delete", icon: Trash2, danger: true, onSelect: onDelete },
      ]}
    />
  );
}
