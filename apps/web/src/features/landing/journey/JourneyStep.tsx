import { motion } from "framer-motion";
import type { JourneyStepData } from "./journeyData.js";

/** A step's circle activates (fills with accent) once the connector line
 * would have reached it — stays activated, since this is a progress fill,
 * not a passing pulse (unlike the ecosystem connector below it). */
export function JourneyStep({ step, index }: { step: JourneyStepData; index: number }) {
  const { n, title, body, Icon } = step;
  return (
    <div className="relative z-10 flex flex-1 flex-row items-start gap-4 sm:flex-col sm:items-center sm:text-center">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
        <Icon className="h-5 w-5 text-fg-subtle" />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.3, delay: 0.15 + index * 0.28 }}
          className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-accent bg-accent-soft"
        >
          <Icon className="h-5 w-5 text-accent" />
        </motion.div>
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-semibold text-fg-subtle ring-1 ring-line">
          {n}
        </span>
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
        <p className="mt-1.5 max-w-[220px] text-[13px] leading-relaxed text-fg-subtle">{body}</p>
      </div>
    </div>
  );
}
