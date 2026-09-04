import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, Check } from "lucide-react";
import { EASE, MOTION } from "../../lib/motion.js";

export interface ToastItem {
  id: number;
  message: string;
  tone: "neutral" | "danger";
  actionLabel?: string;
  onAction?: () => void;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function emit() {
  for (const listener of listeners) listener(items);
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

/**
 * Compact, module-level toasts — a confirmation should be a whisper, not a
 * banner. No provider needed, so any screen can report an outcome. An
 * optional action (e.g. "Undo") renders inline and dismisses the toast once
 * pressed.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function toast(message: string, tone: ToastItem["tone"] = "neutral", action?: { label: string; onAction: () => void }) {
  const id = nextId++;
  items = [...items, { id, message, tone, actionLabel: action?.label, onAction: action?.onAction }].slice(-3);
  emit();
  setTimeout(() => dismiss(id), 3600);
  return id;
}

export function Toaster() {
  const [current, setCurrent] = useState<ToastItem[]>(items);

  useEffect(() => {
    listeners.add(setCurrent);
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-6"
    >
      <AnimatePresence initial={false}>
        {current.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: MOTION.normal, ease: EASE }}
            className="pointer-events-auto flex items-center gap-2 rounded-pill surface-3 surface-edge px-4 py-2.5 text-label text-fg shadow-lift"
          >
            {t.tone === "danger" ? (
              <CircleAlert className="h-3.5 w-3.5 text-critical" />
            ) : (
              <Check className="h-3.5 w-3.5 text-positive" />
            )}
            {t.message}
            {t.actionLabel && t.onAction && (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
                className="ml-1 font-semibold text-accent hover:text-accent-hover"
              >
                {t.actionLabel}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
