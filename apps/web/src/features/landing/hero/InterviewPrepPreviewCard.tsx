import { motion } from "framer-motion";

/** Illustrative Interview Prep preview — the trend line draws once on load. */
export function InterviewPrepPreviewCard() {
  return (
    <div className="w-[200px] rounded-card border border-line bg-surface p-4 shadow-card">
      <p className="text-xs font-semibold text-fg-subtle">Interview Prep</p>
      <p className="mt-1.5 text-sm font-semibold text-fg">Mock Interview</p>
      <p className="text-[11px] text-fg-subtle">Behavioral round</p>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight text-fg">88</span>
        <span className="text-xs text-fg-subtle">/ 100</span>
      </div>

      <svg viewBox="0 0 160 44" preserveAspectRatio="none" className="mt-2 h-11 w-full">
        <motion.path
          d="M0 36 C 20 30, 34 22, 52 24 S 88 12, 108 14 S 140 4, 160 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="text-accent"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        />
      </svg>

      <button type="button" className="mt-2 text-[11px] font-medium text-accent hover:underline">
        Continue practice →
      </button>
    </div>
  );
}
