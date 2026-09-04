import { motion } from "framer-motion";

const ROLES = [
  { title: "Data Scientist", company: "Stripe", location: "Remote" },
  { title: "ML Engineer", company: "OpenAI", location: "San Francisco" },
  { title: "Analytics Engineer", company: "Vercel", location: "Remote" },
];

/** Illustrative Job Board preview — the second role slides in on load,
 * standing in for a live feed updating rather than a static list. */
export function JobBoardPreviewCard() {
  return (
    <div className="w-[220px] rounded-card border border-line bg-surface p-4 shadow-card">
      <p className="text-xs font-semibold text-fg-subtle">Job Board</p>
      <p className="mt-1 text-[11px] text-fg-subtle">Recommended for you</p>

      <div className="mt-2.5 space-y-2">
        {ROLES.map((role, i) => (
          <motion.div
            key={role.title}
            initial={i === 1 ? { opacity: 0, x: -10 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="rounded-control bg-surface-2 px-2.5 py-2"
          >
            <p className="truncate text-[12px] font-semibold text-fg">{role.title}</p>
            <p className="truncate text-[10px] text-fg-subtle">
              {role.company} · {role.location}
            </p>
          </motion.div>
        ))}
      </div>

      <button type="button" className="mt-2.5 text-[11px] font-medium text-accent hover:underline">
        View all jobs →
      </button>
    </div>
  );
}
