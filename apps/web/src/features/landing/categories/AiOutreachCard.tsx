import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { CategoryCardShell } from "./CategoryCardShell.js";

const STATS = [
  { label: "Sent", value: "248" },
  { label: "Replies", value: "36%" },
  { label: "Meetings", value: "28" },
];

export function AiOutreachCard() {
  return (
    <CategoryCardShell
      icon={Send}
      title="AI Outreach"
      tools={["Campaigns", "Templates", "Contacts", "Believe AI Writer", "Email Tracking"]}
      cta="Start a campaign"
    >
      <div className="rounded-control bg-surface-2 p-3">
        <div className="flex items-center justify-between">
          <p className="truncate text-[12px] font-semibold text-fg">Q2 Outreach Campaign</p>
          <motion.span
            initial={{ opacity: 0.4 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="shrink-0 rounded-pill bg-positive/15 px-1.5 py-0.5 text-[9px] font-medium text-positive"
          >
            Active
          </motion.span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-[13px] font-semibold text-fg">{stat.value}</p>
              <p className="text-[9px] text-fg-subtle">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </CategoryCardShell>
  );
}
