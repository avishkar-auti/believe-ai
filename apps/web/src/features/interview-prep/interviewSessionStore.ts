import { create } from "zustand";
import type {
  InterviewAnswerFeedback,
  InterviewDifficulty,
  InterviewQuestion,
  InterviewType,
} from "./interviewApi.js";

interface InterviewSessionState {
  targetRole: string;
  resumeId: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty | "";

  questions: InterviewQuestion[];
  currentIndex: number;
  /** Keyed by question index — only the questions actually answered in this
   * session get an entry, so an average over this map is always a real
   * average over real answers, never padded with unanswered questions. */
  feedbackByIndex: Record<number, InterviewAnswerFeedback>;
  sessionStartedAt: number | null;

  setTargetRole: (v: string) => void;
  setResumeId: (v: string) => void;
  setInterviewType: (v: InterviewType) => void;
  setDifficulty: (v: InterviewDifficulty | "") => void;
  startSession: (questions: InterviewQuestion[]) => void;
  recordFeedback: (index: number, feedback: InterviewAnswerFeedback) => void;
  nextQuestion: () => void;
}

// Session-only, unpersisted — mirrors practiceWorkspaceStore.ts's reasoning:
// a practice session's draft is scoped to the current visit.
export const useInterviewSessionStore = create<InterviewSessionState>((set) => ({
  targetRole: "",
  resumeId: "",
  interviewType: "mixed",
  difficulty: "",

  questions: [],
  currentIndex: 0,
  feedbackByIndex: {},
  sessionStartedAt: null,

  setTargetRole: (v) => set({ targetRole: v }),
  setResumeId: (v) => set({ resumeId: v }),
  setInterviewType: (v) => set({ interviewType: v }),
  setDifficulty: (v) => set({ difficulty: v }),

  startSession: (questions) =>
    set({ questions, currentIndex: 0, feedbackByIndex: {}, sessionStartedAt: Date.now() }),

  recordFeedback: (index, feedback) =>
    set((state) => ({ feedbackByIndex: { ...state.feedbackByIndex, [index]: feedback } })),

  nextQuestion: () => set((state) => ({ currentIndex: Math.min(state.currentIndex + 1, state.questions.length) })),
}));
