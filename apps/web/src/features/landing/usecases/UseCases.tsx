import { motion } from "framer-motion";
import { useState } from "react";
import { DEFAULT_PERSONA_INDEX, PERSONAS } from "./personaData.js";
import { PersonaTabs } from "./PersonaTabs.js";
import { PersonaPanel } from "./PersonaPanel.js";

const revealUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const revealViewport = { once: true, margin: "-80px" } as const;

export function UseCases() {
  const [selected, setSelected] = useState(DEFAULT_PERSONA_INDEX);

  return (
    <section className="bg-surface px-4 py-24 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-content">
        <motion.div initial="hidden" whileInView="show" viewport={revealViewport} variants={revealUp} className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">Built for everyone</p>
          <h2 className="mx-auto mt-3 max-w-xl text-[32px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
            Tailored for how you work.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={revealUp}
          className="mt-14 flex flex-col gap-8 rounded-panel border border-line bg-surface-2/40 p-6 sm:p-8 lg:flex-row lg:gap-10"
        >
          <PersonaTabs selected={selected} onSelect={setSelected} />
          <PersonaPanel persona={PERSONAS[selected] ?? PERSONAS[DEFAULT_PERSONA_INDEX]!} />
        </motion.div>
      </div>
    </section>
  );
}
