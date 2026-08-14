import { useEffect, useState } from "react";

/** Animates a number from 0 up to `target` with an ease-out curve. Dependency-free — no need for a motion library just to count. */
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
