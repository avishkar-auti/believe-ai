import { motion } from "framer-motion";
import { JOURNEY_STEPS } from "./journeyData.js";
import { JourneyStep } from "./JourneyStep.js";
import { JourneyConnector } from "./JourneyConnector.js";

const revealUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const revealViewport = { once: true, margin: "-80px" } as const;

export function JourneySection() {
  return (
    <section className="bg-accent-soft/50 px-4 py-24 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-content">
        <motion.div initial="hidden" whileInView="show" viewport={revealViewport} variants={revealUp} className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">How believe.ai works</p>
          <h2 className="mx-auto mt-3 max-w-xl text-[32px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
            Your journey, simplified in four steps.
          </h2>
        </motion.div>

        <div className="relative mt-16 flex flex-col gap-10 sm:flex-row sm:gap-6">
          <JourneyConnector />
          {JOURNEY_STEPS.map((step, i) => (
            <JourneyStep key={step.n} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
