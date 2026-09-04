import { motion } from "framer-motion";
import { NotebookPen, Folder } from "lucide-react";
import { CategoryCardShell } from "./CategoryCardShell.js";

// Believe Notes organizes notes into folders — a real, personal-notes
// concept (no team/collaboration feature exists, so this doesn't imply one).
const FOLDERS = [
  { label: "Competitive research", count: 6 },
  { label: "Portfolio MVP", count: 4 },
  { label: "User interviews", count: 3 },
];

export function NotesProductivityCard() {
  return (
    <CategoryCardShell icon={NotebookPen} title="Notes & Productivity" tools={["Believe Notes"]} cta="Open Believe Notes">
      <div className="space-y-1.5">
        {FOLDERS.map((folder, i) => (
          <motion.div
            key={folder.label}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className="flex items-center gap-2 rounded-control bg-surface-2 px-2.5 py-2"
          >
            <Folder className="h-3 w-3 shrink-0 text-fg-subtle" />
            <span className="min-w-0 flex-1 truncate text-[11px] text-fg">{folder.label}</span>
            <span className="shrink-0 text-[10px] text-fg-subtle">{folder.count}</span>
          </motion.div>
        ))}
      </div>
    </CategoryCardShell>
  );
}
