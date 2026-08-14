import type { Config } from "tailwindcss";

/**
 * Design language: soft periwinkle canvas, white rounded surfaces, near-black
 * ink, one vivid accent. Headlines are large with tight tracking; body copy is
 * small and muted. Buttons and chips are fully rounded pills.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // The canvas the white page-cards sit on.
        canvas: {
          DEFAULT: "#C7CBE4",
          soft: "#DFE2F0",
          deep: "#A9AFD0",
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
          800: "#1C1F29",
          900: "#0E0F14",
        },
        brand: {
          50: "#EEF0FF",
          100: "#DFE3FF",
          200: "#C0C7FF",
          300: "#9AA5FF",
          400: "#6E7CFF",
          500: "#4353FF",
          600: "#2E3BE0",
          700: "#242DB0",
          800: "#1D2489",
          900: "#181D6B",
        },
        // Data-viz / status accents used sparingly on cards and charts.
        lime: { 400: "#A3D34D", 500: "#8BC34A", 600: "#6FA032" },
        amber: { 400: "#FF9F45", 500: "#FF7A2F", 600: "#E0611A" },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans Variable'", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Display sizes for the big centred headlines.
        display: ["clamp(2.5rem, 5.5vw, 4.5rem)", { lineHeight: "1.04", letterSpacing: "-0.035em" }],
        headline: ["clamp(2rem, 3.6vw, 3rem)", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
        title: ["clamp(1.375rem, 2vw, 1.75rem)", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        card: "1.5rem",
        panel: "2rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,15,20,0.04), 0 8px 24px -12px rgba(14,15,20,0.12)",
        lift: "0 2px 4px rgba(14,15,20,0.05), 0 24px 48px -20px rgba(14,15,20,0.25)",
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
