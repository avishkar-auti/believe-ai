import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";

export function LaunchConfirmationModal({
  open,
  onClose,
  onConfirm,
  launching,
  recipientCount,
  templateName,
  followUpCount,
  dailyLimit,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  launching: boolean;
  recipientCount: number;
  templateName: string | undefined;
  followUpCount: number;
  dailyLimit: number;
}) {
  return (
    <Modal
      open={open}
      title="Launch campaign?"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          <Button onClick={onConfirm} disabled={launching}>
            {launching ? "Launching…" : "Launch campaign"}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={launching}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-2 text-label">
        <p className="text-fg-muted">
          <span className="font-semibold text-fg">{recipientCount}</span> recipient{recipientCount === 1 ? "" : "s"}
        </p>
        <p className="text-fg-muted">
          Initial template: <span className="font-semibold text-fg">{templateName ?? "Not selected"}</span>
        </p>
        <p className="text-fg-muted">
          <span className="font-semibold text-fg">{followUpCount}</span> follow-up{followUpCount === 1 ? "" : "s"}
        </p>
        <p className="text-fg-muted">
          <span className="font-semibold text-fg">{dailyLimit}</span> emails/day
        </p>
      </div>
    </Modal>
  );
}
