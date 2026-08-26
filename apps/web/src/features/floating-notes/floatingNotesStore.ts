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
}

const WIDGET_WIDTH = 288; // matches the w-72 widget width
const WIDGET_HEIGHT = 220; // rough default height, enough to avoid off-screen spawns
const STAGGER = 24;

function defaultPosition(existingCount: number): { x: number; y: number } {
  const stagger = (existingCount % 6) * STAGGER;
  const x = Math.max(16, (typeof window !== "undefined" ? window.innerWidth : 1280) - WIDGET_WIDTH - 24 - stagger);
  const y = Math.max(16, (typeof window !== "undefined" ? window.innerHeight : 800) - WIDGET_HEIGHT - 24 - stagger);
  return { x, y };
}

interface FloatingNotesState {
  floats: FloatEntry[];
  float: (noteId: string) => void;
  unfloat: (noteId: string) => void;
  setMode: (noteId: string, mode: FloatMode) => void;
  move: (noteId: string, x: number, y: number) => void;
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
    }),
    { name: "believe-ai:floating-notes" },
  ),
);
