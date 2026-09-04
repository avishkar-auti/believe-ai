import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export interface StudioCommand {
  label: string;
  hint?: string;
  onRun: () => void;
}

export function StudioCommandPalette({ commands, onClose }: { commands: StudioCommand[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase())),
    [commands, query],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[14vh] backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface-3/95 shadow-lift backdrop-blur-[var(--liquid-blur-lg)]"
      >
        <div className="flex items-center gap-2 border-b border-line px-3.5 py-3">
          <Search className="h-4 w-4 shrink-0 text-fg-subtle" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered[0]) {
                filtered[0].onRun();
                onClose();
              }
              if (e.key === "Escape") onClose();
            }}
            placeholder="Search commands…"
            className="w-full border-0 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-2.5 py-3 text-xs text-fg-subtle">No matching commands.</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  c.onRun();
                  onClose();
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-fg-muted transition-colors duration-150 hover:bg-surface-4 hover:text-fg"
              >
                <span>{c.label}</span>
                {c.hint && <span className="shrink-0 text-[10px] text-fg-subtle">{c.hint}</span>}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
