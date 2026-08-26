import { useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * The hero's product visual: a stylised campaign-performance panel with
 * floating stat cards, built from CSS + inline SVG so it's crisp at any size,
 * themeable, and adds no asset weight. The main panel tilts subtly toward the
 * cursor — a restrained nod to Apple product-page hero treatments.
 */
export function HeroVisual() {
  const bars = [38, 52, 44, 68, 58, 82, 74, 96];

  const panelRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), springConfig);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl" aria-hidden="true">
      {/* Floating stat — top left */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-2 top-8 z-20 rounded-2xl bg-white px-4 py-3 shadow-lift sm:-left-8 dark:bg-ink-800"
      >
        <p className="text-[11px] text-ink-400">Reply rate</p>
        <p className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white">14.2%</p>
        <span className="mt-1 inline-flex items-center rounded-pill bg-lime-500/15 px-1.5 py-0.5 text-[10px] font-medium text-lime-600">
          ▲ 3.1%
        </span>
      </motion.div>

      {/* Floating stat — bottom right */}
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -right-2 bottom-10 z-20 rounded-2xl bg-white px-4 py-3 shadow-lift sm:-right-6 dark:bg-ink-800"
      >
        <p className="text-[11px] text-ink-400">Emails sent</p>
        <p className="text-lg font-semibold tracking-tight text-ink-900 dark:text-white">12,480</p>
        <div className="mt-2 flex items-end gap-0.5">
          {[6, 10, 8, 14, 11, 16].map((h, i) => (
            <span key={i} className="w-1 rounded-sm bg-brand-500/70" style={{ height: `${h}px` }} />
          ))}
        </div>
      </motion.div>

      {/* Floating chip — top right, AI writer */}
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, 1.5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -right-1 top-2 z-20 hidden items-center gap-2 rounded-pill bg-white px-3.5 py-2 shadow-lift sm:flex dark:bg-ink-800"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-medium text-ink-700 dark:text-ink-200">AI writing…</span>
      </motion.div>

      {/* Floating chip — bottom left, follow-up sequence */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        className="absolute -left-4 bottom-2 z-20 hidden items-center gap-2 rounded-pill bg-white px-3.5 py-2 shadow-lift sm:flex dark:bg-ink-800"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-500" />
        </span>
        <span className="text-xs font-medium text-ink-700 dark:text-ink-200">Follow-up sent</span>
      </motion.div>

      {/* Main panel — tilts toward the cursor within its own perspective */}
      <div style={{ perspective: 1200 }} className="relative z-10">
        <motion.div
          ref={panelRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="overflow-hidden rounded-panel border border-white/60 bg-white shadow-lift dark:border-ink-700 dark:bg-ink-800"
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4 dark:border-ink-700">
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">Campaign performance</p>
            <p className="text-xs text-ink-400">Last 30 days</p>
          </div>
          <span className="rounded-pill bg-lime-500/15 px-2.5 py-1 text-xs font-medium text-lime-600">Running</span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-ink-100 border-b border-ink-100 dark:divide-ink-700 dark:border-ink-700">
          {[
            { label: "Opened", value: "62%" },
            { label: "Clicked", value: "28%" },
            { label: "Replied", value: "14%" },
          ].map((s) => (
            <div key={s.label} className="px-6 py-4">
              <p className="text-[11px] text-ink-400">{s.label}</p>
              <p className="text-xl font-semibold tracking-tight text-ink-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Bars + trend line */}
        <div className="relative px-6 pb-6 pt-8">
          <div className="flex h-32 items-end justify-between gap-2 sm:gap-3">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-lime-500/25 to-lime-500"
              />
            ))}
          </div>
          <svg
            viewBox="0 0 320 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-6 bottom-6 h-32 w-[calc(100%-3rem)]"
          >
            <motion.path
              d="M0 78 C 40 70, 70 58, 105 62 S 170 34, 205 30 S 275 12, 320 6"
              fill="none"
              stroke="#4353FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            />
          </svg>
        </div>
        </motion.div>
      </div>
    </div>
  );
}
