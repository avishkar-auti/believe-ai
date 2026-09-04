import { motion } from "framer-motion";
import type { AuthPreviewCardData } from "./authPreviewData.js";

/** A small floating ecosystem-preview card for the auth hero column. Gentle
 * float-in on load, tiny lift + scale on hover — never a dramatic movement. */
export function ProductPreviewCard({ card, index }: { card: AuthPreviewCardData; index: number }) {
  const { label, stat, Icon } = card;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2, scale: 1.015 }}
      transition={{ duration: 0.5, delay: 0.5 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-card transition-shadow duration-150 hover:shadow-card-hover"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-fg">{label}</p>
        <p className="truncate text-[11px] text-fg-subtle">{stat}</p>
      </div>
    </motion.div>
  );
}
