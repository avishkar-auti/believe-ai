/** Shared red/blue/violet chakra-energy palette for the 3D identity card's
 * Phase 2 reskin — every red and every blue in the scene (border, fox-spirit
 * glow, chakra portal, scene lighting, avatar ring) traces back to this one
 * source so they read as one coherent energy system rather than several
 * components each picking their own hue. Deliberately bespoke, not the
 * app's semantic Tailwind tokens — this is WebGL-only styling. */
export const PALETTE = {
  background: {
    deep: "#020204",
    mid: "#030308",
    card: "#05040B",
    top: "#080613",
  },
  cardSurface: {
    base: "#050509",
    mid: "#070711",
    light: "#0B0913",
  },
  red: {
    core: "#FF213D",
    bright: "#FF3B30",
    ember: "#FF4B2B",
    warm: "#FF6A2A",
  },
  blue: {
    core: "#1877FF",
    bright: "#2962FF",
    light: "#4AA3FF",
    cyan: "#54D7FF",
  },
  violet: {
    crossover: "#7C3AED",
    bright: "#9333EA",
    light: "#A855F7",
    hotspot: "#F8FAFF",
  },
  believe: {
    primary: "#7C3AED",
    secondary: "#8B5CF6",
  },
  kuramaEye: {
    core: "#FF3D00",
    bright: "#FF5722",
    amber: "#FF8A00",
  },
} as const;
