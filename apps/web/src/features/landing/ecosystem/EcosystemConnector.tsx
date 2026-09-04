import { motion, useReducedMotion } from "framer-motion";
import { CONNECTOR_PAUSE_DURATION, CONNECTOR_TRAVEL_DURATION } from "./ecosystemData.js";

/** The line the "connection" travels along, from the Resume node to
 * Outreach — a lit dot loops end-to-end continuously once the section is
 * visible, rather than a one-time fill, so the ecosystem always reads as
 * "live." Falls back to a static filled line under reduced motion. */
export function EcosystemConnector() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute left-7 right-7 top-7 h-px bg-line"
      aria-hidden="true"
    >
      {reduceMotion ? (
        <div className="h-full w-full bg-accent/40" />
      ) : (
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { left: "0%", opacity: 0 },
            show: {
              left: ["0%", "0%", "100%", "100%"],
              opacity: [0, 1, 1, 0],
              transition: {
                duration: CONNECTOR_TRAVEL_DURATION + CONNECTOR_PAUSE_DURATION,
                times: [0, 0.02, 0.86, 1],
                repeat: Infinity,
                ease: "linear",
              },
            },
          }}
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_14px_3px_rgb(var(--accent)/0.55)]"
        />
      )}
    </div>
  );
}
