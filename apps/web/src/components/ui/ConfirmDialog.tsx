import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button.js";
import { EASE, MOTION } from "../../lib/motion.js";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (red) instead of accent/primary. */
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** The one confirmation modal in the product — every "are you sure" flows
 * through this instead of a one-off dialog per feature. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.fast }}
            className="absolute inset-0 bg-fg/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: MOTION.fast, ease: EASE }}
            className="relative w-full max-w-sm rounded-card surface-4 surface-edge p-6 shadow-lift"
          >
            <p className="text-h3 text-fg">{title}</p>
            {description && <p className="mt-2 text-sm leading-relaxed text-fg-muted">{description}</p>}
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={onCancel} disabled={busy}>
                {cancelLabel}
              </Button>
              <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
                {busy ? "Working…" : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
