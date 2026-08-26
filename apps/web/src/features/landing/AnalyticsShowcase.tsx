import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * A two-panel analytics showcase for the landing page: an audience-breakdown
 * bar chart on the left, and cycling performance stat tiles + a trend line on
 * the right. Numbers here are the same illustrative product-demo figures used
 * in the hero panel — not a claim about any specific account's real data.
 */

const AUDIENCE_BREAKDOWN = [
  { label: "Recruiters", pct: 71 },
  { label: "Founders", pct: 54 },
  { label: "Sales teams", pct: 46 },
  { label: "Freelancers", pct: 35 },
  { label: "Creators", pct: 26 },
];

const PERFORMANCE_FRAMES = [
  {
    engagement: "+43%",
    followUps: "+56%",
    path: "M0 82 C 30 70, 55 50, 80 58 S 140 30, 170 20 S 230 40, 260 18 S 300 5, 320 2",
    peakLabel: "+32%",
    peakX: 170,
  },
  {
    engagement: "+64%",
    followUps: "+70%",
    path: "M0 70 C 30 55, 55 65, 80 45 S 140 60, 170 25 S 230 12, 260 30 S 300 8, 320 2",
    peakLabel: "+46%",
    peakX: 230,
  },
];

const revealUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const revealStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const revealViewport = { once: true, margin: "-80px" } as const;

export function AnalyticsShowcase() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setFrame((f) => (f + 1) % PERFORMANCE_FRAMES.length), 3200);
    return () => clearInterval(timer);
  }, []);

  const active = PERFORMANCE_FRAMES[frame]!;

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
      variants={revealStagger}
      className="grid gap-5 md:grid-cols-2"
    >
      {/* Audience breakdown */}
      <motion.div
        variants={revealUp}
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="rounded-card bg-ink-50 p-7 transition-shadow duration-300 hover:shadow-lift dark:bg-ink-800/60"
      >
        <h3 className="text-lg font-semibold text-ink-900 dark:text-white">Who's outreach is for</h3>
        <div className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-card dark:bg-ink-800">
          {AUDIENCE_BREAKDOWN.map((row, i) => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="h-6 flex-1 overflow-hidden rounded-pill bg-ink-100 dark:bg-ink-700">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${row.pct}%` }}
                  viewport={revealViewport}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="flex h-full items-center justify-end rounded-pill bg-gradient-to-r from-brand-400 to-brand-500 pr-2"
                >
                  <span className="text-[10px] font-semibold text-white">{row.pct}%</span>
                </motion.div>
              </div>
              <span className="w-24 shrink-0 text-xs text-ink-500 dark:text-ink-400">{row.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="h-2 w-8 rounded-pill bg-brand-500" />
          <span className="h-2 w-8 rounded-pill bg-lime-500" />
          <span className="h-2 w-8 rounded-pill bg-amber-500" />
        </div>
      </motion.div>

      {/* Optimizing performance */}
      <motion.div
        variants={revealUp}
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="rounded-card bg-ink-50 p-7 transition-shadow duration-300 hover:shadow-lift dark:bg-ink-800/60"
      >
        <h3 className="text-lg font-semibold text-ink-900 dark:text-white">Performance you can read</h3>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="col-span-1 space-y-3">
            <div className="rounded-2xl bg-brand-500 p-4 text-white">
              <p className="text-[11px] text-white/70">Engagement</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={active.engagement}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="mt-1 text-xl font-semibold tracking-tight"
                >
                  {active.engagement}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="rounded-2xl bg-lime-500 p-4 text-ink-900">
              <p className="text-[11px] text-ink-900/70">Follow-ups</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={active.followUps}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="mt-1 text-xl font-semibold tracking-tight"
                >
                  {active.followUps}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <div className="relative col-span-2 rounded-2xl bg-white p-4 shadow-card dark:bg-ink-800">
            <div className="flex flex-wrap gap-1.5">
              {["1 week", "1 month", "3 months"].map((range, i) => (
                <span
                  key={range}
                  className={`rounded-pill px-2 py-1 text-[10px] font-medium ${
                    i === 0
                      ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900"
                      : "text-ink-400 dark:text-ink-500"
                  }`}
                >
                  {range}
                </span>
              ))}
            </div>
            <div className="relative mt-3 h-24">
              <svg viewBox="0 0 320 100" preserveAspectRatio="none" className="h-full w-full">
                <AnimatePresence mode="wait">
                  <motion.path
                    key={active.path}
                    d={active.path}
                    fill="none"
                    stroke="#4353FF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </AnimatePresence>
              </svg>
              <AnimatePresence mode="wait">
                <motion.span
                  key={active.peakLabel}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  style={{ left: `${(active.peakX / 320) * 100}%` }}
                  className="absolute -top-1 -translate-x-1/2 rounded-pill bg-ink-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-white dark:text-ink-900"
                >
                  {active.peakLabel}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
