import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import type { DesignScreenSummary } from "@believe-ai/shared";
import { NATIVE_W } from "./canvasLayout.js";
import { DesignRenderer } from "./DesignRenderer.js";
import { cn } from "../../lib/cn.js";

/** Prototype mode: no editor chrome, just the flow. Screens play in canvas order
 * (left-to-right, top-to-bottom), each at its true native width, with the
 * default fade-slide page transition. */
export function PrototypeOverlay({
  screens,
  startIndex,
  onClose,
}: {
  screens: DesignScreenSummary[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const screen = screens[index];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, screens.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, screens.length]);

  if (!screen) return null;
  const nativeWidth = NATIVE_W[screen.platform];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur-[var(--liquid-blur-md)]"
    >
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-pill px-2 py-1 text-xs font-medium text-fg-muted transition-colors duration-150 hover:bg-surface-3 hover:text-fg"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Design Studio
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-semibold text-fg">{screen.title}</span>
          <span className="hidden text-[11px] text-fg-subtle sm:inline">
            {screen.platform === "web" ? "Desktop" : "Mobile"} · {index + 1}/{screens.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <NavButton label="Previous screen" onClick={() => setIndex((i) => Math.max(i - 1, 0))} disabled={index === 0}>
            <ChevronLeft className="h-4 w-4" />
          </NavButton>
          <NavButton
            label="Next screen"
            onClick={() => setIndex((i) => Math.min(i + 1, screens.length - 1))}
            disabled={index >= screens.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </NavButton>
          <NavButton label="Restart flow" onClick={() => setIndex(0)}>
            <RotateCcw className="h-4 w-4" />
          </NavButton>
          <NavButton label="Close preview" onClick={onClose}>
            <X className="h-4 w-4" />
          </NavButton>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="mx-auto overflow-hidden rounded-xl bg-white shadow-lift"
            style={{ width: nativeWidth, maxWidth: "100%" }}
          >
            <DesignRenderer node={screen.dsl} />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function NavButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors duration-150 hover:bg-surface-3 hover:text-fg",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}
