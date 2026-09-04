import { motion } from "framer-motion";

const STATS = [
  { label: "Sent", value: "248" },
  { label: "Reply rate", value: "36%" },
  { label: "Meetings", value: "28" },
];

/** Illustrative AI Outreach preview — same stat-tile visual language as the
 * app's existing HeroVisual panels, restyled onto semantic tokens. Status
 * flips to "Active" once on load. */
export function OutreachPreviewCard() {
  return (
    <div className="w-[220px] rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-fg-subtle">AI Outreach</p>
        <motion.span
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="rounded-pill bg-positive/15 px-2 py-0.5 text-[10px] font-medium text-positive"
        >
          Active
        </motion.span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-fg">Q2 Outreach</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <p className="text-[15px] font-semibold tracking-tight text-fg">{stat.value}</p>
            <p className="text-[10px] text-fg-subtle">{stat.label}</p>
          </div>
        ))}
      </div>

      <button type="button" className="mt-3 text-[11px] font-medium text-accent hover:underline">
        View campaign →
      </button>
    </div>
  );
}
