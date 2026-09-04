import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FloatMode = "normal" | "minimized" | "expanded";

export interface FloatEntry {
  noteId: string;
  mode: FloatMode;
  // Free position (px from top-left of the viewport) — a floated note can be
  // dragged anywhere, not just stacked in one corner.
  x: number;
  y: number;
  // Resizable desktop window — omitted (falls back to DEFAULT_WIDTH/HEIGHT)
  // until the user actually drags the resize handle once.
  width?: number;
  height?: number;
}

export const DEFAULT_WIDTH = 340;
export const DEFAULT_HEIGHT = 420;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 320;
const MAX_WIDTH = 480;
const MAX_HEIGHT = 640;
const STAGGER = 24;
// Bottom margin large enough to clear a typical bottom control bar (Interview
// Room's call controls, Design Studio's canvas prompt bar) even though the
// default spawn position isn't route-aware — dragging still works everywhere.
const BOTTOM_CLEARANCE = 104;

function defaultPosition(existingCount: number): { x: number; y: number } {
  const stagger = (existingCount % 6) * STAGGER;
  const x = Math.max(16, (typeof window !== "undefined" ? window.innerWidth : 1280) - DEFAULT_WIDTH - 24 - stagger);
  const y = Math.max(16, (typeof window !== "undefined" ? window.innerHeight : 800) - DEFAULT_HEIGHT - BOTTOM_CLEARANCE - stagger);
  return { x, y };
}

interface FloatingNotesState {
  floats: FloatEntry[];
  float: (noteId: string) => void;
  unfloat: (noteId: string) => void;
  setMode: (noteId: string, mode: FloatMode) => void;
  move: (noteId: string, x: number, y: number) => void;
  resize: (noteId: string, width: number, height: number) => void;
}

export function clampSize(width: number, height: number): { width: number; height: number } {
  return { width: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)), height: Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height)) };
}

// The app's first Zustand store — persisted to localStorage under the same
// "believe-ai:<feature>" key convention ThemeProvider already established,
// so floated notes survive a full page reload, not just in-app navigation.
export const useFloatingNotesStore = create<FloatingNotesState>()(
  persist(
    (set) => ({
      floats: [],
      float: (noteId) =>
        set((state) =>
          state.floats.some((f) => f.noteId === noteId)
            ? state
            : { floats: [...state.floats, { noteId, mode: "normal", ...defaultPosition(state.floats.length) }] },
        ),
      unfloat: (noteId) => set((state) => ({ floats: state.floats.filter((f) => f.noteId !== noteId) })),
      setMode: (noteId, mode) => set((state) => ({ floats: state.floats.map((f) => (f.noteId === noteId ? { ...f, mode } : f)) })),
      move: (noteId, x, y) => set((state) => ({ floats: state.floats.map((f) => (f.noteId === noteId ? { ...f, x, y } : f)) })),
      resize: (noteId, width, height) => set((state) => ({ floats: state.floats.map((f) => (f.noteId === noteId ? { ...f, width, height } : f)) })),
    }),
    { name: "believe-ai:floating-notes" },
  ),
);
