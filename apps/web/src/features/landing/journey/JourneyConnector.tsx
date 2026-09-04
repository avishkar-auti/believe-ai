import { motion } from "framer-motion";

/** Draws once as the section enters view: a track line with an accent fill
 * that grows from the first step's circle to the last — horizontal on
 * desktop, vertical on mobile (per brief's mobile-journey spec). */
export function JourneyConnector() {
  return (
    <>
      <div
        className="pointer-events-none absolute left-7 right-7 top-7 hidden h-px overflow-hidden bg-line sm:block"
        aria-hidden="true"
      >
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }}
          className="h-full w-full origin-left bg-accent"
        />
      </div>
      <div
        className="pointer-events-none absolute bottom-7 left-7 top-7 w-px overflow-hidden bg-line sm:hidden"
        aria-hidden="true"
      >
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }}
          className="h-full w-full origin-top bg-accent"
        />
      </div>
    </>
  );
}
