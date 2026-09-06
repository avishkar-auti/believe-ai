import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Braces, Check, Circle } from "lucide-react";
import type { PersonalizationVariable } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { Z } from "../../lib/zIndex.js";
import { MOTION } from "../../lib/motion.js";
import { usePersonalizationContext } from "./usePersonalization.js";

const GROUP_LABELS = {
  recipient: "About the recipient",
  sender: "From your profile",
} as const;

const GROUP_HINTS = {
  recipient: "Filled per contact when the email sends.",
  sender: "Filled from your profile — edit it there and every template follows.",
} as const;

/** The "Insert variable" menu.
 *
 * Deliberately not the shared `Menu`: this picker's whole point is showing
 * what each sender variable *currently resolves to*, so someone can see that
 * {{senderTitle}} is empty before sending two hundred emails that say
 * "I'm a ." — a flat list of labels can't do that. Values come from the
 * server (GET /templates/variables), the same resolver the send path uses. */
export function VariablePicker({ onInsert }: { onInsert: (token: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, isLoading } = usePersonalizationContext();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const groups: ("recipient" | "sender")[] = ["recipient", "sender"];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Insert variable"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
          open ? "bg-accent-soft text-accent" : "text-fg-muted hover:bg-fg/[0.06] hover:text-fg",
        )}
      >
        <Braces className="h-3.5 w-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.98 }}
            transition={{ duration: MOTION.fast }}
            role="menu"
            className={cn("absolute right-0 mt-1 max-h-[26rem] w-80 overflow-y-auto rounded-xl surface-3 surface-edge p-1.5 shadow-lift", Z.menu)}
          >
            {isLoading && <p className="px-2 py-3 text-caption text-fg-subtle">Loading your profile…</p>}

            {data &&
              groups.map((group) => {
                const rows = data.variables.filter((v) => v.group === group);
                if (rows.length === 0) return null;
                return (
                  <div key={group} className="mb-1 last:mb-0">
                    <div className="px-2 pb-1 pt-1.5">
                      <p className="text-section uppercase text-fg-subtle">{GROUP_LABELS[group]}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-fg-subtle">{GROUP_HINTS[group]}</p>
                    </div>
                    {rows.map((variable) => (
                      <VariableRow
                        key={variable.key}
                        variable={variable}
                        onSelect={() => {
                          setOpen(false);
                          onInsert(variable.token);
                        }}
                      />
                    ))}
                  </div>
                );
              })}

            {data && data.missingSenderKeys.length > 0 && (
              <Link
                to="/app/settings/profile"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-lg border border-dashed border-line-strong px-2.5 py-2 text-caption text-fg-muted transition-colors hover:border-accent hover:text-accent"
              >
                {data.missingSenderKeys.length} profile field{data.missingSenderKeys.length === 1 ? "" : "s"} still empty — fill them in →
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VariableRow({ variable, onSelect }: { variable: PersonalizationVariable; onSelect: () => void }) {
  // Recipient variables have no "current value" to show — they resolve to a
  // different person on every send — so they get the neutral treatment rather
  // than a checkmark that would imply something is configured.
  const isSender = variable.group === "sender";

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-fg/[0.06]"
    >
      {isSender ? (
        variable.configured ? (
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" />
        ) : (
          <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-subtle" />
        )
      ) : (
        <span className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-label text-fg">{variable.label}</span>
          <code className="shrink-0 text-[11px] text-fg-subtle">{variable.token}</code>
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-fg-subtle">
          {isSender ? (variable.currentValue ?? "Not set on your profile") : variable.description}
        </span>
      </span>
    </button>
  );
}
