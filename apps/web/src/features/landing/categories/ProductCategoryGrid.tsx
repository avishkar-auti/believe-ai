import { motion } from "framer-motion";
import { CareerIntelligenceCard } from "./CareerIntelligenceCard.js";
import { PracticeLearningCard } from "./PracticeLearningCard.js";
import { AiOutreachCard } from "./AiOutreachCard.js";
import { CreateBuildCard } from "./CreateBuildCard.js";
import { NotesProductivityCard } from "./NotesProductivityCard.js";
import { CommunityNewsCard } from "./CommunityNewsCard.js";

const revealUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const revealStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const revealViewport = { once: true, margin: "-80px" } as const;

/** The 6 real product areas, each with its own distinct mini visualization —
 * deliberately not identical internally (per the brief). */
export function ProductCategoryGrid() {
  return (
    <section className="bg-surface-2/40 px-4 py-24 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-content">
        <motion.div initial="hidden" whileInView="show" viewport={revealViewport} variants={revealUp} className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
            Powerful tools. Endless possibilities.
          </p>
          <h2 className="mx-auto mt-3 max-w-xl text-[32px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
            One workspace, every product area.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={revealStagger}
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <motion.div variants={revealUp}>
            <CareerIntelligenceCard />
          </motion.div>
          <motion.div variants={revealUp}>
            <PracticeLearningCard />
          </motion.div>
          <motion.div variants={revealUp}>
            <AiOutreachCard />
          </motion.div>
          <motion.div variants={revealUp}>
            <CreateBuildCard />
          </motion.div>
          <motion.div variants={revealUp}>
            <NotesProductivityCard />
          </motion.div>
          <motion.div variants={revealUp}>
            <CommunityNewsCard />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
