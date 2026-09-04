import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { OrbitFeaturePreview } from "./OrbitFeaturePreview.js";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const STATEMENT_WORDS = ["Learn.", "Build.", "Prepare.", "Connect.", "Grow."];

const BENEFITS = [
  "All your tools in one intelligent workspace",
  "AI that understands your goals",
  "Save time, take action, and grow faster",
];

export function WelcomeStep({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <motion.div initial="hidden" animate="show" variants={container} className="grid gap-12 lg:grid-cols-2 lg:items-center">
      <div>
        <motion.p variants={item} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
          Welcome to believe.ai
        </motion.p>

        <motion.h1 variants={item} className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-tight text-fg sm:text-[38px]">
          One workspace for everything you&rsquo;re working toward.
        </motion.h1>

        <motion.p variants={item} className="mt-2 text-[18px] font-semibold leading-tight tracking-tight">
          {STATEMENT_WORDS.map((word, i) => (
            <span key={word} className={i % 2 === 0 ? "text-accent" : "text-fg"}>
              {word}{" "}
            </span>
          ))}
        </motion.p>

        <motion.ul variants={item} className="mt-6 space-y-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2.5 text-[14px] text-fg">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              {benefit}
            </li>
          ))}
        </motion.ul>

        <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={onStart}>
            Get started
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-fg-subtle transition-colors hover:text-fg"
          >
            I&rsquo;ll set this up later
          </button>
        </motion.div>
      </div>

      <motion.div variants={item} className="hidden lg:block">
        <OrbitFeaturePreview />
      </motion.div>
    </motion.div>
  );
}
