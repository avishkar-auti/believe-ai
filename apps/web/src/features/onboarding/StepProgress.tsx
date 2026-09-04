import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { STEP_LABELS } from "./onboardingData.js";

/** Connector line fills smoothly toward the active node as `current`
 * advances; completed nodes reveal a checkmark; the active node's ring
 * fills with accent. Per the brief's progress-tracker motion spec.
 * `complete` forces every node to its done state, for the final screen —
 * onboarding has 5 internal steps (Welcome/About/Goal/Setup/All-set) but
 * only 4 visual nodes, since Setup and All-set both represent "You're set". */
export function StepProgress({ current, complete = false }: { current: number; complete?: boolean }) {
  const fillPercent = complete ? 100 : (Math.min(current, STEP_LABELS.length - 1) / (STEP_LABELS.length - 1)) * 100;

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-4 right-4 top-4 h-0.5 -translate-y-1/2 overflow-hidden bg-line">
          <motion.div
            initial={false}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-accent"
          />
        </div>

        {STEP_LABELS.map((label, i) => {
          const done = complete || i < current;
          const active = !complete && i === current;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: done || active ? "rgb(var(--accent))" : "rgb(var(--surface))",
                  borderColor: done || active ? "rgb(var(--accent))" : "rgb(var(--line))",
                  scale: active ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-semibold"
              >
                {done ? (
                  <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Check className="h-3.5 w-3.5 text-accent-fg" />
                  </motion.span>
                ) : (
                  <span className={active ? "text-accent-fg" : "text-fg-subtle"}>{i + 1}</span>
                )}
              </motion.div>
              <span
                className={`hidden text-[11px] font-medium transition-colors sm:block ${
                  active ? "text-fg" : "text-fg-subtle"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
