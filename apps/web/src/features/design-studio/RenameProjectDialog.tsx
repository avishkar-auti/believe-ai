import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Modal } from "../../components/ui/Modal.js";

export function RenameProjectDialog({
  open,
  currentName,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  return (
    <Modal
      open={open}
      title="Rename project"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          <Button onClick={() => onSave(name.trim())} disabled={saving || !name.trim() || name.trim() === currentName}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <label className="block">
        <span className="text-label text-fg-muted">Project name</span>
        <Input
          className="mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
          autoFocus
        />
      </label>
    </Modal>
  );
}
