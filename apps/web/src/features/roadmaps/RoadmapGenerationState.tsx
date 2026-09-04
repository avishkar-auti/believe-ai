import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const GENERIC_PHRASES = ["Mapping the skills you'll need…", "Structuring a learning sequence…", "Finding documentation and videos…"];
const PERSONALIZED_PHRASE = "Checking your resume for skills you already have…";

/** Building a roadmap is a single request with no real progress events from
 * the backend, so this cycles honest, generic phase copy rather than a fake
 * percentage or a checklist implying verified step completion. */
export function RoadmapGenerationState({ personalized }: { personalized: boolean }) {
  const phrases = personalized ? [PERSONALIZED_PHRASE, ...GENERIC_PHRASES] : GENERIC_PHRASES;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const interval = setInterval(() => setIndex((i) => (i + 1) % phrases.length), 1700);
    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div className="flex items-center gap-3 rounded-control border border-line bg-surface-2 px-4 py-3.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">Building your roadmap</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={phrases[index]}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.2 }}
            className="text-caption text-fg-subtle"
          >
            {phrases[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
