import { useEffect, useState } from "react";

export interface Countdown {
  /** "Xd Yh", "Xh Ym", "Xm Ys", or "Xs" — the coarsest two non-zero units, dropping to seconds under a minute. */
  label: string;
  /** True once `target` has passed. */
  elapsed: boolean;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Live countdown to `target` in the viewer's own local time zone — ticks
 * every second, no dependency. Formatting (toLocaleString elsewhere) and
 * this countdown both read the browser's local clock/zone automatically,
 * so a scheduler and an invitee in different time zones each see times
 * and "starts in" correctly relative to themselves. */
export function useCountdown(target: Date | string): Countdown {
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = targetMs - now;
  return { label: formatRemaining(remaining), elapsed: remaining <= 0 };
}
