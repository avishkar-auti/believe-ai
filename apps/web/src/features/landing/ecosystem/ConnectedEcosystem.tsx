import { motion } from "framer-motion";
import { ECOSYSTEM_NODES } from "./ecosystemData.js";
import { EcosystemNode } from "./EcosystemNode.js";
import { EcosystemConnector } from "./EcosystemConnector.js";

const revealUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const revealViewport = { once: true, margin: "-80px" } as const;

export function ConnectedEcosystem() {
  return (
    <section className="bg-surface px-4 py-24 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-content">
        <motion.div initial="hidden" whileInView="show" viewport={revealViewport} variants={revealUp} className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">Everything connects</p>
          <h2 className="mx-auto mt-3 max-w-xl text-[32px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
            One ecosystem. Every step of your career.
          </h2>
        </motion.div>

        <div className="relative mt-16 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 sm:snap-none sm:justify-between sm:overflow-visible sm:pb-0">
          <EcosystemConnector />
          {ECOSYSTEM_NODES.map((node, i) => (
            <EcosystemNode key={node.key} node={node} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
