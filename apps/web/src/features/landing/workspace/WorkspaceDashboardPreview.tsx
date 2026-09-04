import { motion } from "framer-motion";
import { CheckCircle2, Circle, House, Send, Sparkles, Users, GraduationCap, Briefcase } from "lucide-react";
import believeIcon from "../../../assets/brand/believe-icon.png";

const METRICS = [
  { label: "Tasks due", value: "12" },
  { label: "Applications", value: "24" },
  { label: "Interviews", value: "3" },
  { label: "Profile strength", value: "92%" },
  { label: "Learning streak", value: "14" },
];

const TODAY_PLAN = [
  { label: "Review ML System Design", done: true },
  { label: "Apply to 5 recommended jobs", done: false },
  { label: "Continue Python course", done: false },
  { label: "Reach out to 3 connections", done: false },
];

const UPCOMING = [
  { title: "Mock Interview", time: "Today, 3:00 PM" },
  { title: "Career Fair", time: "May 26, 11:00 AM" },
  { title: "Portfolio Review", time: "May 30, 2:00 PM" },
];

const RAIL_ICONS = [House, Send, Users, GraduationCap, Briefcase];

const revealChild = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

/** A stylized, readable preview of the real Believe.ai workspace — not a
 * literal screenshot, but built from the app's real tokens/card patterns so
 * it reads as the same product. Illustrative persona ("Alex") and figures,
 * same convention as the hero's product-preview cards. */
export function WorkspaceDashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="flex overflow-hidden rounded-panel border border-line bg-surface shadow-lift"
    >
      {/* Nod to the real app's sidebar rail — decorative, not interactive. */}
      <div className="hidden shrink-0 flex-col items-center gap-3 border-r border-line bg-surface-2 px-3 py-5 sm:flex">
        <img src={believeIcon} alt="" className="h-7 w-7" />
        <div className="mt-2 flex flex-col gap-2.5">
          {RAIL_ICONS.map((Icon, i) => (
            <span
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-control ${i === 0 ? "bg-accent-soft text-accent" : "text-fg-subtle"}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1 p-5 sm:p-6">
        <div>
          <p className="text-[15px] font-semibold text-fg">Good morning, Alex 👋</p>
          <p className="text-xs text-fg-subtle">Here&rsquo;s what&rsquo;s happening in your workspace.</p>
        </div>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-5"
        >
          {METRICS.map((metric) => (
            <motion.div key={metric.label} variants={revealChild} className="rounded-control bg-surface-2 px-3 py-2.5">
              <p className="text-lg font-semibold tracking-tight text-fg">{metric.value}</p>
              <p className="mt-0.5 truncate text-[10px] text-fg-subtle">{metric.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-4">
            <div className="rounded-control border border-line p-4">
              <p className="text-xs font-semibold text-fg-subtle">Today&rsquo;s Plan</p>
              <div className="mt-2.5 space-y-2">
                {TODAY_PLAN.map((task) => (
                  <div key={task.label} className="flex items-center gap-2">
                    {task.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-positive" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                    )}
                    <span className={`truncate text-[12px] ${task.done ? "text-fg-subtle line-through" : "text-fg"}`}>
                      {task.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-control border border-line p-4">
              <p className="text-xs font-semibold text-fg-subtle">Overview</p>
              <svg viewBox="0 0 260 70" preserveAspectRatio="none" className="mt-2 h-16 w-full">
                <motion.path
                  d="M0 55 C 26 48, 44 34, 65 38 S 110 20, 135 24 S 180 8, 210 10 S 245 4, 260 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  className="text-accent"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                />
              </svg>
            </div>
          </div>

          <div className="rounded-control border border-line p-4">
            <p className="text-xs font-semibold text-fg-subtle">Upcoming</p>
            <motion.div
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="mt-2.5 space-y-2.5"
            >
              {UPCOMING.map((event) => (
                <motion.div key={event.title} variants={revealChild} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-fg">{event.title}</p>
                    <p className="truncate text-[10px] text-fg-subtle">{event.time}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
