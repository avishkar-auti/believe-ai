import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../../../components/ui/Button.js";
import { AmbientBackground } from "../../../components/layout/AmbientBackground.js";
import { HeroEcosystem } from "./HeroEcosystem.js";
import { HeroCenterCard } from "./HeroCenterCard.js";
import { CareerFitPreviewCard } from "./CareerFitPreviewCard.js";
import { JobBoardPreviewCard } from "./JobBoardPreviewCard.js";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const STATEMENT_WORDS = ["Learn.", "Build.", "Prepare.", "Connect.", "Grow."];

export function Hero() {
  return (
    <section className="relative px-4 pb-20 pt-16 sm:px-6 lg:pb-28 lg:pt-20">
      <AmbientBackground />

      <div className="relative mx-auto grid max-w-content items-center gap-14 lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]">
        <motion.div initial="hidden" animate="show" variants={container}>
          <motion.p
            variants={item}
            className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent"
          >
            Your AI workspace
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-4 text-[42px] font-semibold leading-[1.03] tracking-tight text-fg sm:text-[52px] lg:text-[64px]"
          >
            One workspace for
            <br />
            everything you&rsquo;re
            <br />
            working toward.
          </motion.h1>

          <motion.p variants={item} className="mt-4 text-[34px] font-semibold leading-tight tracking-tight sm:text-[42px]">
            {STATEMENT_WORDS.map((word, i) => (
              <span key={word} className={i % 2 === 0 ? "text-accent" : "text-fg"}>
                {word}{" "}
              </span>
            ))}
          </motion.p>

          <motion.p variants={item} className="mt-5 max-w-md text-[15px] leading-relaxed text-fg-muted">
            Believe.ai brings your career tools, learning, interview preparation, job discovery, outreach, notes,
            design, and AI-powered workflows into one connected workspace.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup">
              <Button size="lg">Start with Believe.ai →</Button>
            </Link>
            <a href="#product">
              <Button size="lg" variant="secondary">
                Explore the workspace
              </Button>
            </a>
          </motion.div>
        </motion.div>

        <div>
          <HeroEcosystem />

          {/* Mobile/tablet — simplified stack, no absolute positioning or
              connectors (brief §76/§77: hide extra floating cards, connector
              network simplified below lg). */}
          <div className="flex flex-col items-center gap-4 lg:hidden">
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, delay: 0.5 }}>
              <HeroCenterCard />
            </motion.div>
            <div className="flex flex-wrap justify-center gap-3">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
                <CareerFitPreviewCard />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.68 }}>
                <JobBoardPreviewCard />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
