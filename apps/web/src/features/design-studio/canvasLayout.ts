import type { DesignPlatform } from "@believe-ai/shared";

export const CARD_W = 360;
export const CARD_H = 240;

const GRID_GAP = 48;
const GRID_COLS = 4;

/** A screen's true render width per platform — used both to scale the canvas
 * thumbnail down and to size the full preview so exported PNGs reflect the
 * intended layout rather than whatever width a panel happens to be. */
export const NATIVE_W: Record<DesignPlatform, number> = { web: 1280, mobile: 390 };

export const DEVICE_LABEL: Record<DesignPlatform, string> = { web: "Desktop · 1280", mobile: "Mobile · 390" };

/** Same deterministic grid used server-side when a screen is first created
 * (see design_service.py) — used here only to place a generating-placeholder
 * node immediately, before the server has assigned the real position. */
export function gridPosition(index: number) {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return { x: col * (CARD_W + GRID_GAP), y: row * (CARD_H + GRID_GAP) };
}

/** Spatial continuity: work spawned from a selected screen appears immediately
 * beside it (variations to the right, responsive versions below) rather than
 * at the end of a grid the user can no longer see. */
export function besidePosition(origin: { x: number; y: number }, index = 0) {
  return { x: origin.x + (CARD_W + GRID_GAP) * (index + 1), y: origin.y };
}

export function belowPosition(origin: { x: number; y: number }) {
  return { x: origin.x, y: origin.y + CARD_H + GRID_GAP };
}

/** Tidy the given nodes into a grid anchored at the top-left of their current
 * bounding box, so "Arrange" never yanks the canvas somewhere unexpected. */
export function arrangePositions(positions: { id: string; x: number; y: number }[]) {
  if (positions.length === 0) return [];
  const originX = Math.min(...positions.map((p) => p.x));
  const originY = Math.min(...positions.map((p) => p.y));
  const ordered = [...positions].sort((a, b) => a.y - b.y || a.x - b.x);
  return ordered.map((p, i) => {
    const cell = gridPosition(i);
    return { id: p.id, x: originX + cell.x, y: originY + cell.y };
  });
}
