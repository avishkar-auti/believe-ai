import { motion } from "framer-motion";
import { METRIC_CARDS } from "./analyticsData.js";
import { MetricCard } from "./MetricCard.js";
import { ActivityChart } from "./ActivityChart.js";
import { ActivitySourceChart } from "./ActivitySourceChart.js";

const revealUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const revealStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const revealViewport = { once: true, margin: "-80px" } as const;

export function GrowthAnalytics() {
  return (
    <section className="bg-accent-soft/40 px-4 py-24 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-content">
        <motion.div initial="hidden" whileInView="show" viewport={revealViewport} variants={revealUp} className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">Insights that drive growth</p>
          <h2 className="mx-auto mt-3 max-w-xl text-[32px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
            Track what matters. Improve every day.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={revealStagger}
          className="mt-12 grid grid-cols-3 gap-4"
        >
          {METRIC_CARDS.map((metric) => (
            <motion.div key={metric.label} variants={revealUp}>
              <MetricCard metric={metric} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={revealStagger}
          className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        >
          <motion.div variants={revealUp}>
            <ActivityChart />
          </motion.div>
          <motion.div variants={revealUp}>
            <ActivitySourceChart />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
