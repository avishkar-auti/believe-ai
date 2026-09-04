import { motion } from "framer-motion";

const LINE_D = "M0 110 C 40 104, 60 98, 90 96 S 150 70, 180 68 S 230 40, 260 42 S 330 20, 400 15";
const FILL_D = `${LINE_D} L400 140 L0 140 Z`;

/** The "Activity Overview" line chart — draws over ~800ms once visible, per
 * the brief's analytics-motion spec. Illustrative shape, not plotted from
 * real account data. */
export function ActivityChart() {
  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <p className="text-[13px] font-semibold text-fg">Activity overview</p>
      <p className="mt-0.5 text-[11px] text-fg-subtle">Product preview — not live account data.</p>
      <svg viewBox="0 0 400 140" preserveAspectRatio="none" className="mt-4 h-36 w-full overflow-visible">
        <defs>
          <linearGradient id="landingActivityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.22" />
            <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={FILL_D}
          fill="url(#landingActivityFill)"
          stroke="none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
        />
        <motion.path
          d={LINE_D}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
