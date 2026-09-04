import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";

export interface ChecklistItem {
  label: string;
  done: boolean;
}

/** Reflects what the user actually did in the flow — not a fixed decorative
 * list, so an item only shows checked if that step genuinely happened. */
export function CompletionChecklist({ items }: { items: ChecklistItem[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
          className="flex items-center gap-2.5 text-[14px] text-fg"
        >
          {item.done ? (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive/15 text-positive">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          ) : (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-subtle">
              <Circle className="h-2.5 w-2.5" />
            </span>
          )}
          <span className={item.done ? "text-fg" : "text-fg-subtle"}>{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
