import { motion } from "framer-motion";
import { ACTIVITY_SEGMENTS } from "./analyticsData.js";

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Donut chart, animates once (each segment fades in in sequence) per the
 * brief's analytics-motion spec. */
export function ActivitySourceChart() {
  let cumulative = 0;
  const segments = ACTIVITY_SEGMENTS.map((seg, i) => {
    const len = (seg.percent / 100) * CIRCUMFERENCE;
    const offset = cumulative;
    cumulative += len;
    return { ...seg, len, offset, i };
  });

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <p className="text-[13px] font-semibold text-fg">Activity by area</p>
      <p className="mt-0.5 text-[11px] text-fg-subtle">Where your time in believe.ai goes.</p>
      <div className="mt-5 flex items-center gap-6">
        <svg viewBox="0 0 80 80" className="h-24 w-24 shrink-0 -rotate-90">
          <circle cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="10" className="text-line" stroke="currentColor" />
          {segments.map((seg) => (
            <motion.circle
              key={seg.label}
              cx="40"
              cy="40"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeDasharray={`${seg.len} ${CIRCUMFERENCE - seg.len}`}
              strokeDashoffset={-seg.offset}
              className={seg.textClass}
              stroke="currentColor"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: 0.15 + seg.i * 0.12 }}
            />
          ))}
        </svg>
        <div className="flex-1 space-y-2">
          {ACTIVITY_SEGMENTS.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-fg-subtle">
                <span className={`h-2 w-2 rounded-full ${seg.dotClass}`} />
                {seg.label}
              </span>
              <span className="font-medium text-fg">{seg.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
