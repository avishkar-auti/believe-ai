import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn.js";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  isError?: boolean;
}

/** A compact, upper-left floating activity log — not a persistent sidebar.
 * Matches the real Stitch layout: a small card showing recent messages,
 * only present once there's something to show, sitting above the canvas
 * rather than occupying a full-height column. Assistant messages are
 * honest, factual confirmations of what actually happened ("Generated
 * 'X'"), never invented AI narration — this app's prompts never fabricate
 * content, and neither does this panel. */
export function ActivityLog({ messages }: { messages: ChatMessage[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="absolute left-4 top-4 z-10 max-h-[280px] w-[300px] overflow-hidden rounded-2xl border border-ink-700 bg-ink-800/95 shadow-lift backdrop-blur">
      <div ref={listRef} className="max-h-[280px] space-y-2.5 overflow-y-auto p-3.5">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-1.5 text-xs leading-snug",
                m.role === "user"
                  ? "bg-white text-ink-900"
                  : m.isError
                    ? "bg-red-500/10 text-red-400"
                    : "bg-ink-900/60 text-ink-200",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
