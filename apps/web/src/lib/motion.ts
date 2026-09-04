/**
 * The app's motion scale, as plain seconds (framer-motion's `transition`
 * takes seconds, not ms) so every consumer spreads `transition={{ duration:
 * MOTION.fast, ease: EASE }}` instead of picking a fresh number each time.
 * Codifies the range already in informal use across the app (0.15-0.2s for
 * quick UI feedback, ~0.3s for entrances) rather than inventing new values.
 */
export const MOTION = {
  /** Toggle-like state changes with no spatial motion — a checkbox, an icon swap. */
  instant: 0.09,
  /** Hover/press feedback, menus, toasts — the most common duration. */
  fast: 0.14,
  /** Panels, drawers, dialogs — anything that moves into place. */
  normal: 0.2,
  /** Page-level entrances, larger surfaces settling in. */
  slow: 0.3,
} as const;

/** Matches the rest of the app's easing choices (design-studio's AgentPanel,
 * etc.) — a slight ease-out with no overshoot. */
export const EASE = [0.2, 0, 0, 1] as const;
