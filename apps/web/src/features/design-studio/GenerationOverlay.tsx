import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/** A brief transitional moment while the project is created — real network
 * time (createDesignProject has no AI call, so this is typically well under
 * a second), with the same cosmetic staged-caption idea GeneratingScreenNode
 * already uses on the canvas (decoupled from real progress, an established
 * pattern in this feature — see studioConfig.ts's GENERATION_STAGES). The
 * canvas itself takes over the honest longer wait for the actual AI screen
 * once navigation lands there. */
const STAGES = ["Understanding your idea…", "Setting up your canvas…"];

export function GenerationOverlay({ active }: { active: boolean }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!active) {
      setStage(0);
      return;
    }
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 700);
    return () => clearInterval(id);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface/90 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <motion.span
              className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent-soft text-accent"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.span>
            <p className="text-sm font-medium text-fg">{STAGES[stage]}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
