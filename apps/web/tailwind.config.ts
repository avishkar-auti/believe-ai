import type { Config } from "tailwindcss";

/**
 * Design language: neutral grey canvas, white rounded surfaces, near-black
 * ink, one vivid accent. Headlines are large with tight tracking; body copy is
 * small and muted. Buttons and chips are fully rounded pills.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // The canvas the white page-cards sit on — neutral grey, no blue tint.
        canvas: {
          DEFAULT: "#F1F1F3",
          soft: "#F6F6F8",
          deep: "#E4E4E8",
        },
        // Near-black through to off-white. `ink-900` is the headline colour.
        ink: {
          50: "#F7F8FA",
          100: "#EFF1F4",
          200: "#E1E4EA",
          300: "#C7CCD6",
          400: "#98A0AE",
          500: "#6B7280",
          600: "#4B5160",
          700: "#333846",
          800: "#141414",
          900: "#000000",
        },
        // Kept in sync with --accent in index.css so pages not yet migrated
        // to the semantic tokens still land on the same violet identity.
        brand: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        // Data-viz / status accents used sparingly on cards and charts.
        lime: { 400: "#A3D34D", 500: "#8BC34A", 600: "#6FA032" },
        amber: { 400: "#FF9F45", 500: "#FF7A2F", 600: "#E0611A" },
        // Semantic tokens backed by CSS variables (see index.css :root/.dark) —
        // used by newer feature UI (interview rooms) that themes via a single
        // class instead of paired dark: utilities.
        fg: {
          DEFAULT: "rgb(var(--fg) / <alpha-value>)",
          muted: "rgb(var(--fg-muted) / <alpha-value>)",
          subtle: "rgb(var(--fg-subtle) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
          fg: "rgb(var(--accent-fg) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
        },
        positive: "rgb(var(--positive) / <alpha-value>)",
        critical: "rgb(var(--critical) / <alpha-value>)",
        caution: "rgb(var(--caution) / <alpha-value>)",
        informative: "rgb(var(--informative) / <alpha-value>)",
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          strong: "rgb(var(--line-strong) / <alpha-value>)",
        },
        // Base + 4-step elevation scale for panel-heavy canvases (design
        // studio). Pages using it force the `dark` class on their own root so
        // they read as an always-dark tool regardless of the app-wide theme.
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
          3: "rgb(var(--surface-3) / <alpha-value>)",
          4: "rgb(var(--surface-4) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans Variable'", "Inter", "system-ui", "sans-serif"],
        // Headlines, page titles, and hero numbers only — deliberately not the
        // body/UI face. A distinctive character grotesque instead of the
        // geometric-sans-for-everything look most AI-generated products default to.
        display: ["'Bricolage Grotesque Variable'", "'Plus Jakarta Sans Variable'", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Display sizes for the big centred headlines.
        display: ["clamp(2.5rem, 5.5vw, 4.5rem)", { lineHeight: "1.04", letterSpacing: "-0.035em" }],
        headline: ["clamp(2rem, 3.6vw, 3rem)", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
        title: ["clamp(1.375rem, 2vw, 1.75rem)", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        // In-page heading + copy scale used alongside the semantic tokens above.
        h1: ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        h2: ["1.375rem", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
        h3: ["1.0625rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        label: ["0.875rem", { lineHeight: "1.45", fontWeight: "500" }],
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
        section: ["0.6875rem", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "0.04em" }],
      },
      borderRadius: {
        // A restrained scale — huge 24-32px corners on every container is
        // the single most recognizable "AI-generated template" tell. `pill`
        // stays available for things that genuinely want it (badges, avatar
        // chips, segmented controls) but is no longer the default for
        // buttons/inputs/cards.
        control: "0.625rem",
        card: "0.875rem",
        panel: "1.125rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,15,20,0.04), 0 8px 24px -12px rgba(14,15,20,0.12)",
        // Slightly deeper — the hover state for a soft-shadow card, so
        // interaction reads as the shadow settling closer rather than the
        // element itself moving or scaling.
        "card-hover": "0 2px 4px rgba(14,15,20,0.06), 0 12px 32px -10px rgba(124,58,237,0.22)",
        lift: "0 2px 4px rgba(14,15,20,0.05), 0 24px 48px -20px rgba(14,15,20,0.25)",
      },
      maxWidth: {
        content: "72rem",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        // A very slow drift + soft pulse for the ambient background blobs —
        // barely perceptible motion, not a visible loop.
        ambient: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(2%, -3%) scale(1.06)" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        ambient: "ambient 22s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
