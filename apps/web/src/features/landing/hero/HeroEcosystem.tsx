import { useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { HeroCenterCard } from "./HeroCenterCard.js";
import { CareerFitPreviewCard } from "./CareerFitPreviewCard.js";
import { InterviewPrepPreviewCard } from "./InterviewPrepPreviewCard.js";
import { JobBoardPreviewCard } from "./JobBoardPreviewCard.js";
import { OutreachPreviewCard } from "./OutreachPreviewCard.js";
import { LearningRoadmapPreviewCard } from "./LearningRoadmapPreviewCard.js";
import { DesignStudioPreviewCard } from "./DesignStudioPreviewCard.js";

// Design coordinate system (px, 600x520) used only to compute proportional
// (%) positions and the SVG connector geometry — the container itself is
// fluid (w-full up to a max), so this never dictates real rendered pixels.
// Node centers stay well inside [0,600]x[0,520] with margin for each card's
// own width, so nothing overflows the grid column even at the narrower end
// of the lg breakpoint range.
const BOX = { w: 600, h: 500 };
const CENTER = { x: 300, y: 240 };
const NODES = [
  { key: "careerFit", x: 115, y: 90, Card: CareerFitPreviewCard, delay: 0.6, float: { x: 0, y: -3, dur: 7 } },
  { key: "interview", x: 300, y: 55, Card: InterviewPrepPreviewCard, delay: 0.66, float: { x: 2, y: -2, dur: 8 } },
  { key: "jobBoard", x: 485, y: 100, Card: JobBoardPreviewCard, delay: 0.72, float: { x: -2, y: 3, dur: 9 } },
  { key: "outreach", x: 115, y: 390, Card: OutreachPreviewCard, delay: 0.78, float: { x: 3, y: 2, dur: 7.5 } },
  { key: "roadmap", x: 300, y: 425, Card: LearningRoadmapPreviewCard, delay: 0.84, float: { x: 0, y: 3, dur: 8.5 } },
  { key: "design", x: 485, y: 380, Card: DesignStudioPreviewCard, delay: 0.9, float: { x: -3, y: -2, dur: 9.5 } },
] as const;

function pct(x: number, y: number) {
  return { left: `${(x / BOX.w) * 100}%`, top: `${(y / BOX.h) * 100}%` };
}

function ConnectorLines() {
  return (
    <svg
      viewBox={`0 0 ${BOX.w} ${BOX.h}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full text-accent"
    >
      {NODES.map((node) => {
        const midX = (CENTER.x + node.x) / 2;
        const midY = (CENTER.y + node.y) / 2 - 12;
        return (
          <motion.path
            key={node.key}
            d={`M${CENTER.x},${CENTER.y} Q${midX},${midY} ${node.x},${node.y}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.25 }}
            transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
          />
        );
      })}
    </svg>
  );
}

/** The hero's main visual — a constellation of real Believe.ai capabilities
 * around a central Believe AI card, connected by thin lines. Desktop/large
 * tablet only (lg+); smaller viewports get a simplified stacked layout in
 * Hero.tsx instead of trying to reflow this fixed composition. Each node is
 * three independent layers (position % → parallax → entrance+float) so the
 * parallax motion value and the entrance/idle animations never fight over
 * the same transform. */
export function HeroEcosystem() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 120, damping: 20, mass: 0.5 };
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-5, 5]), springConfig);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto hidden w-full max-w-[600px] lg:block"
      style={{ aspectRatio: `${BOX.w} / ${BOX.h}` }}
      aria-hidden="true"
    >
      <ConnectorLines />

      {NODES.map((node) => (
        <div key={node.key} style={pct(node.x, node.y)} className="absolute -translate-x-1/2 -translate-y-1/2">
          <motion.div style={{ x: parallaxX, y: parallaxY }}>
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: node.delay, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                animate={prefersReducedMotion ? undefined : { x: [0, node.float.x, 0], y: [0, node.float.y, 0] }}
                transition={{ duration: node.float.dur, repeat: Infinity, ease: "easeInOut" }}
              >
                <node.Card />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      ))}

      <div style={pct(CENTER.x, CENTER.y)} className="absolute z-10 -translate-x-1/2 -translate-y-1/2">
        <motion.div style={{ x: parallaxX, y: parallaxY }}>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroCenterCard />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
