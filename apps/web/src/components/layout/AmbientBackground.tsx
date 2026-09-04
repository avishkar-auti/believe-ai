import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../app/providers/ThemeProvider.js";

/**
 * Ambient light field behind the shell. Two very slow, very soft gradient
 * fields — plus, in liquid mode on pointer devices, a single highlight that
 * drifts a few pixels toward the cursor. Everything is CSS transform/opacity,
 * nothing animates per frame in JS, and touch devices get the static version.
 */
export function AmbientBackground() {
  const { liquid } = useTheme();
  const frame = useRef<number | null>(null);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.35 });

  useEffect(() => {
    if (!liquid) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onMove = (event: PointerEvent) => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        setPointer({ x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight });
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [liquid]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-40 left-[12%] h-[38rem] w-[38rem] animate-ambient rounded-full blur-[120px]"
        style={{ background: "var(--accent)", opacity: `calc(0.1 * var(--ambient-opacity) * 2)` }}
      />
      <div
        className="absolute bottom-[-12rem] right-[8%] h-[32rem] w-[32rem] animate-ambient rounded-full blur-[130px]"
        style={{
          background: "var(--accent-hover)",
          opacity: `calc(0.07 * var(--ambient-opacity) * 2)`,
          animationDelay: "-14s",
        }}
      />
      {liquid && (
        <div
          className="absolute h-[26rem] w-[26rem] rounded-full blur-[140px] transition-transform duration-[1200ms] ease-out"
          style={{
            background: "var(--accent)",
            opacity: 0.1,
            left: `calc(${pointer.x * 100}% - 13rem)`,
            top: `calc(${pointer.y * 100}% - 13rem)`,
          }}
        />
      )}
    </div>
  );
}
