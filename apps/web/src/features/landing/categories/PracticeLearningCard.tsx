import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { CategoryCardShell } from "./CategoryCardShell.js";

export function PracticeLearningCard() {
  return (
    <CategoryCardShell
      icon={GraduationCap}
      title="Practice & Learning"
      tools={["AI Practice Lab", "Interview Prep", "Practice Room", "Learning Roadmap"]}
      cta="Start practicing"
    >
      <div className="rounded-control bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-fg-muted">
        <span className="text-accent">SELECT</span> name, <span className="text-accent">COUNT</span>(*)
        <br />
        <span className="text-accent">FROM</span> orders
        <br />
        <span className="text-accent">GROUP BY</span> name;
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            whileInView={{ width: "72%" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <span className="shrink-0 text-[10px] font-medium text-fg-subtle">72%</span>
      </div>
      <p className="mt-1.5 text-[10px] text-fg-subtle">
        Next: <span className="font-medium text-fg">Window Functions</span>
      </p>
    </CategoryCardShell>
  );
}
