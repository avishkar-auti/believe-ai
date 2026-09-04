import { motion } from "framer-motion";

const ROWS = [
  { label: "Skills match", value: 0.94 },
  { label: "Experience", value: 0.82 },
  { label: "Market demand", value: 0.88 },
];

/** Illustrative Career Fit preview — the ring fills once on load, a real
 * state-change animation rather than decorative motion. */
export function CareerFitPreviewCard() {
  return (
    <div className="w-[210px] rounded-card border border-line bg-surface p-4 shadow-card">
      <p className="text-xs font-semibold text-fg-subtle">Career Fit</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-3" />
            <motion.circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              className="text-positive"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 0.92 }}
              transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-fg">92%</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">Data Scientist</p>
          <p className="text-[11px] font-medium text-positive">Great match</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {ROWS.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span className="w-[72px] shrink-0 text-[10px] text-fg-subtle">{row.label}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${row.value * 100}%` }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
