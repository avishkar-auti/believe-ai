/** Presentation helpers shared by the practice-room shell. Pure formatting —
 * no room state, no realtime behaviour. */

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** "32:18", or "1:02:18" once past an hour. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Meet-style adaptive tile grid — 1 large, 2 side by side, 3–4 as 2×2, then 3 across. */
export function stageGridClass(tileCount: number): string {
  if (tileCount <= 1) return "grid-cols-1";
  if (tileCount === 2) return "grid-cols-1 sm:grid-cols-2";
  if (tileCount <= 4) return "grid-cols-1 sm:grid-cols-2";
  if (tileCount <= 6) return "grid-cols-2 lg:grid-cols-3";
  return "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
}

/** Deterministic avatar tint per participant so tiles stay recognisable
 * between renders without storing anything server-side. */
export function avatarTint(userId: string): string {
  const tints = [
    "bg-accent-soft text-accent",
    "bg-informative/15 text-informative",
    "bg-positive/15 text-positive",
    "bg-caution/15 text-caution",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) % 997;
  return tints[hash % tints.length] as string;
}
