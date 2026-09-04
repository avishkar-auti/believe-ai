import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function StudioHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="text-center"
    >
      <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
        <Sparkles className="h-3.5 w-3.5" /> AI Design Studio
      </p>
      <h1 className="mt-3 text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.1] tracking-tight text-fg">
        Create something <span className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">incredible.</span>
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
        Describe a product, screen, or experience. Believe AI will turn your idea into an editable interface.
      </p>
    </motion.div>
  );
}
