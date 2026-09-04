import { motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";

const THUMBS = [
  { label: "Brand deck", swatch: "bg-accent-soft" },
  { label: "Dashboard", swatch: "bg-informative/15" },
  { label: "Mobile", swatch: "bg-positive/15" },
];

/** Illustrative Design Studio preview — the mini canvas thumbnails fade in
 * once on load. */
export function DesignStudioPreviewCard() {
  return (
    <div className="w-[210px] rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-1.5">
        <LayoutTemplate className="h-3.5 w-3.5 text-fg-subtle" />
        <p className="text-xs font-semibold text-fg-subtle">Design Studio</p>
      </div>
      <p className="mt-1.5 text-[11px] text-fg-subtle">Recent designs</p>

      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        {THUMBS.map((thumb, i) => (
          <motion.div
            key={thumb.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
          >
            <div className={`aspect-[4/3] w-full rounded-control ${thumb.swatch}`} />
            <p className="mt-1 truncate text-center text-[9px] text-fg-subtle">{thumb.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
