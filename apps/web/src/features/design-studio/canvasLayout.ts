import type { DesignPlatform } from "@believe-ai/shared";

export const CARD_W = 360;
export const CARD_H = 240;

const GRID_GAP = 48;
const GRID_COLS = 4;

/** A screen's true render width per platform — used both to scale the canvas
 * thumbnail down and to size the side panel's full preview so exported PNGs
 * reflect the intended layout rather than whatever width a panel happens to be. */
export const NATIVE_W: Record<DesignPlatform, number> = { web: 1280, mobile: 390 };

/** Same deterministic grid used server-side when a screen is first created
 * (see design_service.py) — used here only to place a generating-placeholder
 * node immediately, before the server has assigned the real position. */
export function gridPosition(index: number) {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return { x: col * (CARD_W + GRID_GAP), y: row * (CARD_H + GRID_GAP) };
}
