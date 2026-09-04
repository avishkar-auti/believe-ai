import { motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";
import { CategoryCardShell } from "./CategoryCardShell.js";

const THUMBS = [
  { label: "Website", swatch: "bg-accent-soft" },
  { label: "Dashboard", swatch: "bg-informative/15" },
  { label: "Mobile", swatch: "bg-positive/15" },
];

export function CreateBuildCard() {
  return (
    <CategoryCardShell icon={LayoutTemplate} title="Create & Build" tools={["Design Studio", "Believe Notes"]} cta="Open Design Studio">
      <div className="grid grid-cols-3 gap-2">
        {THUMBS.map((thumb, i) => (
          <motion.div
            key={thumb.label}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
          >
            <div className={`aspect-[4/3] w-full rounded-control border border-line ${thumb.swatch}`} />
            <p className="mt-1 truncate text-center text-[9px] text-fg-subtle">{thumb.label}</p>
          </motion.div>
        ))}
      </div>
    </CategoryCardShell>
  );
}
