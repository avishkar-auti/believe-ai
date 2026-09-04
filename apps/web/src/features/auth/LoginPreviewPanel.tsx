import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const METRICS = [
  { label: "Applications", value: "24" },
  { label: "Replies", value: "12" },
  { label: "Interviews", value: "3" },
];

/** A lightweight workspace snapshot for the sign-in hero column — same
 * illustrative "Alex" persona and stat-tile language as the landing page's
 * WorkspaceDashboardPreview, scaled down for this smaller slot. */
export function LoginPreviewPanel() {
  return (
    <div className="rounded-panel border border-line bg-surface p-5 shadow-lift">
      <p className="text-[14px] font-semibold text-fg">Good morning, Alex</p>
      <p className="text-[11px] text-fg-subtle">Here&rsquo;s what&rsquo;s happening this week.</p>

      <svg viewBox="0 0 220 56" preserveAspectRatio="none" className="mt-4 h-12 w-full">
        <motion.path
          d="M0 44 C 24 40, 40 28, 60 30 S 96 14, 120 18 S 160 6, 220 4"
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        />
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {METRICS.map((metric) => (
          <div key={metric.label} className="rounded-control bg-surface-2 px-2.5 py-2">
            <p className="text-[15px] font-semibold tracking-tight text-fg">{metric.value}</p>
            <p className="truncate text-[10px] text-fg-subtle">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-control border border-line px-3 py-2.5">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-fg">Interview with Google</p>
          <p className="truncate text-[10px] text-fg-subtle">May 10 · 10:00 AM</p>
        </div>
      </div>
    </div>
  );
}
