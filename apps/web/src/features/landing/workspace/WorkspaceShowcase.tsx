import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { WorkspaceDashboardPreview } from "./WorkspaceDashboardPreview.js";

const BULLETS = [
  "One login. Every tool.",
  "AI that understands your goals.",
  "Work across devices, in real time.",
  "Your data, private and secure.",
];

const revealUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const revealViewport = { once: true, margin: "-80px" } as const;

/** "All-in-one, all connected" — editorial copy + a real-feeling workspace
 * preview, demonstrating (not just claiming) that Believe.ai's tools live in
 * one place. */
export function WorkspaceShowcase() {
  return (
    <section id="product" className="px-4 py-24 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-content items-center gap-12 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)] lg:gap-16">
        <motion.div initial="hidden" whileInView="show" viewport={revealViewport} variants={revealUp}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">All-in-one. All connected.</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
            Everything you need
            <br />
            to move forward.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
            Believe.ai brings powerful tools and AI together so you can learn, create, apply, and grow — faster and
            with more clarity.
          </p>

          <ul className="mt-6 space-y-3">
            {BULLETS.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2.5 text-[14px] text-fg">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </motion.div>

        <WorkspaceDashboardPreview />
      </div>
    </section>
  );
}
