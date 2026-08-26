import { useEffect } from "react";
import { X } from "lucide-react";
import type { DesignScreenSummary } from "@believe-ai/shared";
import { NATIVE_W } from "./canvasLayout.js";
import { DesignRenderer } from "./DesignRenderer.js";

/** Full, scrollable view of a screen at its real native width — the small
 * canvas card clips to a fixed thumbnail height, so anything below the fold
 * (a landing page's feature/testimonial sections, for example) is never
 * visible there. Mirrors the real Stitch "Preview" mode, which expands the
 * selected screen into a scrollable frame at its true dimensions instead of
 * the clipped canvas thumbnail. */
export function PreviewModal({ screen, onClose }: { screen: DesignScreenSummary; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const nativeWidth = NATIVE_W[screen.platform];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-ink-700 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink-50">{screen.title}</h2>
            <span className="text-xs uppercase tracking-wide text-ink-500">
              {screen.platform} · {nativeWidth}px wide
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-ink-400 transition-colors hover:bg-ink-700 hover:text-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-auto bg-ink-900/60 p-6">
          <div className="mx-auto overflow-hidden rounded-xl bg-white shadow-lift" style={{ width: nativeWidth }}>
            <DesignRenderer node={screen.dsl} />
          </div>
        </div>
      </div>
    </div>
  );
}
