/**
 * Motion vocabulary for the Modern experience.
 *
 * Deliberately separate from lib/motion.ts (which the classic shell uses):
 * Modern is slower and softer on purpose, and mixing the two produced
 * components that felt like they belonged to different products. Every
 * Modern component pulls its timings from here rather than inventing values
 * at the call site.
 *
 * Durations are seconds, matching framer-motion's units.
 */
export const MODERN_MOTION = {
  duration: {
    fast: 0.16,
    normal: 0.24,
    medium: 0.32,
    slow: 0.48,
  },
  ease: {
    /** The house curve — a long, confident ease-out with no overshoot. */
    smooth: [0.16, 1, 0.3, 1],
    standard: [0.22, 1, 0.36, 1],
  },
  spring: {
    soft: { type: "spring", stiffness: 260, damping: 28, mass: 0.8 },
    snappy: { type: "spring", stiffness: 420, damping: 32 },
  },
  /** Grouped card reveals — small enough that a 6-card grid still lands fast. */
  stagger: 0.04,
} as const;

/** Page/section entrance. Paired with `staggerReveal` on a parent when a
 * group of cards should arrive in sequence rather than all at once. */
export const fadeReveal = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MODERN_MOTION.duration.medium, ease: MODERN_MOTION.ease.smooth },
  },
} as const;

export const staggerReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: MODERN_MOTION.stagger } },
} as const;
