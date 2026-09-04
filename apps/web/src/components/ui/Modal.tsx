import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { EASE, MOTION } from "../../lib/motion.js";

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

/** A centered dialog for editing one record — LinkedIn's "Add experience"
 * style, as opposed to Drawer.tsx's side-panel pattern. Same shape as
 * Drawer (title/subtitle/footer/children) so call sites can swap between
 * the two without restructuring their form. */
export function Modal({ open, title, subtitle, onClose, footer, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.fast }}
            className="absolute inset-0 bg-fg/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: MOTION.normal, ease: EASE }}
            className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-panel surface-4 surface-edge shadow-lift"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
              <div className="min-w-0">
                <p className="text-h3 text-fg">{title}</p>
                {subtitle && <p className="mt-0.5 text-caption text-fg-muted">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-pill p-1.5 text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-line px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
