import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { cn } from "../../lib/cn.js";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  isError?: boolean;
}

/** Collapsible agent log — the canvas stays the workspace, this is secondary.
 * Assistant lines are factual confirmations of what the API actually did; the
 * panel never invents narration or exposes model reasoning. `isGenerating`
 * breathes the Believe Intelligence Layer glow while a request is in flight. */
export function AgentPanel({
  messages,
  onClose,
  selectionSummary,
  isGenerating = false,
}: {
  messages: ChatMessage[];
  onClose: () => void;
  selectionSummary: string;
  isGenerating?: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className={cn(
        "absolute right-3 top-3 bottom-28 z-20 flex w-[300px] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface-3/90 backdrop-blur-[var(--liquid-blur-lg)]",
        // The intelligence-layer glow replaces the resting shadow while
        // generating rather than stacking with it — both set box-shadow, so
        // combining them would just have one silently override the other.
        isGenerating ? "ai-edge ai-edge-active" : "shadow-lift",
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-fg">
          <Sparkles className={cn("h-3.5 w-3.5 text-accent", isGenerating && "animate-pulse")} /> Believe Designer
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close agent panel"
          className="flex h-6 w-6 items-center justify-center rounded-pill text-fg-subtle transition-colors duration-150 hover:bg-surface-4 hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="text-[11px] leading-relaxed text-fg-subtle">
            Describe a screen in the prompt bar to start. Select a screen first and the request is scoped to it.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                {m.role === "user" ? "You" : "Believe"}
              </p>
              <p className={cn("text-xs leading-relaxed", m.isError ? "text-critical" : "text-fg-muted")}>{m.text}</p>
            </div>
          ))
        )}
      </div>

      <footer className="border-t border-line px-3 py-2">
        <p className="truncate text-[10px] text-fg-subtle">Context: {selectionSummary}</p>
      </footer>
    </motion.aside>
  );
}
