import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { LogoReveal } from "../../components/ui/LogoReveal.js";
import { AmbientBackground } from "../../components/layout/AmbientBackground.js";
import { StepProgress } from "./StepProgress.js";

/** Shared chrome for every onboarding step — logo, animated stepper, and a
 * centered card area. Light-only, same as the auth screens (brief-mandated),
 * via the shared `theme-light` token override. */
export function OnboardingShell({ step, children }: { step: number; children: ReactNode }) {
  // 5 internal steps map to 4 visual stepper nodes — Setup Workspace (index
  // 3) and All Set (index 4) both represent the stepper's final "You're set" node.
  const stepperCurrent = Math.min(step, 3);
  const stepperComplete = step >= 4;
  return (
    <div className="theme-light relative min-h-screen bg-surface px-4 py-10 sm:px-6">
      <AmbientBackground />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center">
        <div className="mb-8">
          <LogoReveal size={26} layout="horizontal" wordmarkClassName="text-base font-bold tracking-tight" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-10 w-full"
        >
          <StepProgress current={stepperCurrent} complete={stepperComplete} />
        </motion.div>

        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
