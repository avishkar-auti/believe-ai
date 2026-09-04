import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Briefcase, Flame } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";

const revealUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const revealViewport = { once: true, margin: "-80px" } as const;

/** Subtle lavender-bordered container, not a saturated purple block — the
 * brief is explicit that this shouldn't read as a heavy marketing banner.
 * The two floating cards are illustrative product-preview content (same
 * convention as the rest of the page) and are hidden on mobile per the
 * brief's mobile-final-CTA spec, rather than crowding a small screen. */
export function FinalCTA() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:py-28">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        variants={revealUp}
        className="relative mx-auto max-w-content"
      >
        <div className="relative overflow-hidden rounded-panel border-2 border-accent/20 bg-accent-soft/30 px-6 py-20 text-center sm:px-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">Your ai workspace</p>
          <h2 className="mx-auto mt-3 max-w-lg text-[32px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
            Your future starts in one workspace.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-fg-subtle">
            Bring your career, learning, creation, and outreach into one connected AI workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg">Start with Believe.ai →</Button>
            </Link>
            <a href="#product">
              <Button size="lg" variant="secondary">
                Explore the workspace
              </Button>
            </a>
          </div>

          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={revealViewport}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="pointer-events-none absolute left-6 top-10 hidden w-48 rounded-card border border-line bg-surface p-3.5 text-left shadow-lift lg:block"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Briefcase className="h-3.5 w-3.5" />
            </span>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-fg-subtle">New opportunity</p>
            <p className="mt-0.5 text-[13px] font-semibold text-fg">Data Scientist</p>
            <p className="text-[11px] text-fg-subtle">Stripe · Remote</p>
            <p className="mt-1 text-[12px] font-semibold text-positive">94% match</p>
          </motion.div>

          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={revealViewport}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pointer-events-none absolute bottom-10 right-6 hidden w-44 rounded-card border border-line bg-surface p-3.5 text-left shadow-lift lg:block"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Flame className="h-3.5 w-3.5" />
            </span>
            <p className="mt-2 text-[13px] font-semibold text-fg">You&rsquo;re on fire</p>
            <p className="text-[11px] text-fg-subtle">14-day streak</p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
