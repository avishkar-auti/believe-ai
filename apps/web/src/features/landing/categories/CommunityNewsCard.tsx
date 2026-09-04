import { motion } from "framer-motion";
import { Users2, MessageCircle } from "lucide-react";
import { CategoryCardShell } from "./CategoryCardShell.js";

// Illustrative preview content, same convention as the rest of the page —
// not a claim about live discussion counts.
const DISCUSSIONS = [
  { title: "Breaking into Product", replies: 245 },
  { title: "ML Engineer Salary Guide", replies: 180 },
  { title: "Best Projects for Portfolio", replies: 152 },
];

export function CommunityNewsCard() {
  return (
    <CategoryCardShell icon={Users2} title="Community / News" tools={["Community", "News"]} cta="Join the conversation">
      <p className="text-[10px] font-medium uppercase tracking-wide text-fg-subtle">Top discussions</p>
      <div className="mt-2 space-y-1.5">
        {DISCUSSIONS.map((d, i) => (
          <motion.div
            key={d.title}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className="flex items-center justify-between gap-2 rounded-control bg-surface-2 px-2.5 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-[11px] text-fg">{d.title}</span>
            <span className="flex shrink-0 items-center gap-1 text-[10px] text-fg-subtle">
              <MessageCircle className="h-3 w-3" />
              {d.replies}
            </span>
          </motion.div>
        ))}
      </div>
    </CategoryCardShell>
  );
}
