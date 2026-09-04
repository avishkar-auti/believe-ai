import { motion, useReducedMotion } from "framer-motion";
import type { EcosystemNodeData } from "./ecosystemData.js";
import { CONNECTOR_CYCLE_DURATION, nodeGlowDelay } from "./ecosystemData.js";

const GLOW_DURATION = 0.7;

/** Circle, icon, and card border light up together as the traveling
 * connector dot reaches this node's position, then settle back to a quiet
 * resting state — a pass-through pulse that repeats every lap, not a
 * permanent activation (unlike the journey steps, which stay filled once
 * reached). */
export function EcosystemNode({ node, index }: { node: EcosystemNodeData; index: number }) {
  const { label, desc, stat, Icon } = node;
  const reduceMotion = useReducedMotion();
  const delay = nodeGlowDelay(index);

  const glowVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: reduceMotion ? 0 : [0, 1, 0],
      transition: reduceMotion
        ? undefined
        : {
            duration: GLOW_DURATION,
            delay,
            times: [0, 0.45, 1],
            repeat: Infinity,
            repeatDelay: CONNECTOR_CYCLE_DURATION - GLOW_DURATION,
          },
    },
  };

  return (
    <div className="relative z-10 flex w-40 shrink-0 snap-center flex-col items-center gap-3 text-center sm:w-auto sm:flex-1">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
        <Icon className="h-5 w-5 text-fg-subtle" />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={glowVariants}
          className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-accent bg-accent-soft"
        >
          <Icon className="h-5 w-5 text-accent" />
        </motion.div>
      </div>
      <div className="relative w-full">
        <div className="w-full rounded-card border border-line bg-surface px-3.5 py-3 shadow-card">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-fg">{label}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-fg-subtle">{desc}</p>
          {stat ? <p className="mt-1.5 text-[13px] font-semibold text-accent">{stat}</p> : null}
        </div>
        <motion.div
          aria-hidden="true"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={glowVariants}
          className="pointer-events-none absolute inset-0 rounded-card border-2 border-accent/60 shadow-[0_0_20px_rgb(var(--accent)/0.25)]"
        />
      </div>
    </div>
  );
}
