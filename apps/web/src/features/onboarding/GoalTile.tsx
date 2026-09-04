import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { GoalOption } from "./onboardingData.js";

export function GoalTile({ goal, selected, onSelect }: { goal: GoalOption; selected: boolean; onSelect: () => void }) {
  const { label, description, Icon } = goal;
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      className={`flex items-start gap-3 rounded-card border-2 p-4 text-left transition-colors duration-150 ${
        selected ? "border-accent bg-accent-soft/60 shadow-card" : "border-line bg-surface hover:border-line-strong"
      }`}
    >
      <motion.span
        animate={selected ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${
          selected ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg-subtle"
        }`}
      >
        <Icon className="h-4 w-4" />
      </motion.span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-fg">{label}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-fg-subtle">{description}</p>
      </div>
      {selected && (
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg"
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </motion.span>
      )}
    </motion.button>
  );
}
