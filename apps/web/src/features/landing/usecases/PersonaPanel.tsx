import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import type { PersonaData } from "./personaData.js";

/** Crossfades (opacity + translateX 8px, 180-240ms) whenever the selected
 * persona changes, per the brief's persona-tabs motion spec. */
export function PersonaPanel({ persona }: { persona: PersonaData }) {
  return (
    <div className="min-w-0 flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={persona.key}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid gap-8 sm:grid-cols-2"
        >
          <div>
            <h3 className="text-[19px] font-semibold leading-snug text-fg">{persona.headline}</h3>
            <ul className="mt-5 space-y-3">
              {persona.capabilities.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-fg-subtle">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3 self-start">
            {persona.features.map((feature) => (
              <Link
                key={feature.label}
                to={feature.to}
                className="flex flex-col items-start gap-2.5 rounded-card border border-line bg-surface p-4 shadow-card transition-colors duration-150 hover:border-accent/30"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-control bg-accent-soft text-accent">
                  <feature.Icon className="h-4 w-4" />
                </span>
                <span className="text-[12px] font-medium text-fg">{feature.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
