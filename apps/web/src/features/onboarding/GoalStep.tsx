import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button.js";
import { GoalTile } from "./GoalTile.js";
import { GOALS } from "./onboardingData.js";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export function GoalStep({
  goal,
  onSelect,
  onBack,
  onNext,
}: {
  goal: string;
  onSelect: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <motion.div initial="hidden" animate="show" variants={container}>
      <motion.div variants={item} className="text-center">
        <h1 className="text-[26px] font-semibold tracking-tight text-fg">What are you trying to achieve?</h1>
        <p className="mt-1.5 text-[14px] text-fg-subtle">Select the main goal so we can personalize your workspace.</p>
      </motion.div>

      <motion.div variants={item} role="radiogroup" aria-label="Your goal" className="mt-8 grid gap-3 sm:grid-cols-2">
        {GOALS.map((option) => (
          <GoalTile key={option.value} goal={option} selected={goal === option.value} onSelect={() => onSelect(option.value)} />
        ))}
      </motion.div>

      <motion.div variants={item} className="mt-8 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" onClick={onNext} disabled={!goal}>
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
