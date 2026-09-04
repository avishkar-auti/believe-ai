import { create } from "zustand";
import type { ChallengeStarterFile, ExecutionResult } from "@believe-ai/shared";

interface PracticeWorkspaceState {
  challengeSlug: string | null;
  activeFilePath: string | null;
  /** Dirty overlay over the challenge's starterFiles, keyed by path — what's
   * actually in the editor right now, not what's saved on the server. */
  fileContents: Record<string, string>;
  lastResult: ExecutionResult | null;

  loadChallenge: (slug: string, starterFiles: ChallengeStarterFile[]) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  setLastResult: (result: ExecutionResult | null) => void;
}

// Session-only, unpersisted — unlike floatingNotesStore, a workspace's draft
// is scoped to the current visit, not meant to survive a reload.
export const usePracticeWorkspaceStore = create<PracticeWorkspaceState>((set, get) => ({
  challengeSlug: null,
  activeFilePath: null,
  fileContents: {},
  lastResult: null,

  loadChallenge: (slug, starterFiles) => {
    if (get().challengeSlug === slug) return;
    set({
      challengeSlug: slug,
      activeFilePath: starterFiles[0]?.path ?? null,
      fileContents: Object.fromEntries(starterFiles.map((f) => [f.path, f.content])),
      lastResult: null,
    });
  },

  setActiveFile: (path) => set({ activeFilePath: path }),

  updateFileContent: (path, content) => set((state) => ({ fileContents: { ...state.fileContents, [path]: content } })),

  setLastResult: (result) => set({ lastResult: result }),
}));
