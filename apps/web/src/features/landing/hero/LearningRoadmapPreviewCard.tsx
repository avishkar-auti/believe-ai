import { motion } from "framer-motion";

const STEPS = ["Python", "SQL", "ML Basics", "Stats", "Projects"];

/** Illustrative Learning Roadmap preview — the progress line fills once on
 * load, marking the 3rd of 5 steps as reached (67%). */
export function LearningRoadmapPreviewCard() {
  return (
    <div className="w-[240px] rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-fg-subtle">Learning Roadmap</p>
        <span className="text-[11px] font-medium text-fg-muted">67%</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-fg">Data Science Path</p>

      <div className="relative mt-4 flex items-center justify-between">
        <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-surface-3" />
        <motion.div
          className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-accent"
          initial={{ width: 0 }}
          animate={{ width: "67%" }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        />
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`relative z-10 h-2 w-2 rounded-full ${i <= 2 ? "bg-accent" : "border border-line bg-surface"}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] text-fg-subtle">
        {STEPS.map((step) => (
          <span key={step} className="w-8 truncate text-center first:text-left last:text-right">
            {step}
          </span>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-fg-subtle">
        Next: <span className="font-medium text-fg">Machine Learning</span>
      </p>
    </div>
  );
}
