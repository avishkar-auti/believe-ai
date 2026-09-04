import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { MetricCardData } from "./analyticsData.js";

/** Counts up from ~80% of its value to the final value over 500ms once
 * visible, per the brief's analytics-motion spec. Skips the animation and
 * shows the final value immediately under reduced motion. */
export function MetricCard({ metric }: { metric: MetricCardData }) {
  const { label, value, suffix = "" } = metric;
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : Math.round(value * 0.8));

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const controls = animate(Math.round(value * 0.8), value, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-card">
      <p ref={ref} className="text-[28px] font-semibold tracking-tight text-fg">
        {display}
        {suffix}
      </p>
      <p className="mt-1 text-[12px] text-fg-subtle">{label}</p>
    </div>
  );
}
