import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/cn.js";
import { EASE, MOTION } from "../../lib/motion.js";

interface DrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  /** Extra classes on the fixed overlay wrapper — e.g. "lg:hidden" so a
   * drawer used as a mobile/tablet-only fallback never renders at desktop
   * breakpoints even while `open` is true. */
  className?: string;
}

/** A centered dialog for a form or a detail view — same positioning as
 * Modal.tsx (kept as a separate component since call sites reach for it by
 * name for a list/form context, and so the two can diverge again later if a
 * real side-panel need comes back), just a touch narrower by default. */
export function Drawer({ open, title, subtitle, onClose, footer, children, className }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 z-[60] flex items-center justify-center p-4", className)} role="dialog" aria-modal="true">
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
            className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-panel surface-4 surface-edge shadow-lift"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
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
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
