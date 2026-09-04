import { ArrowUp, MessagesSquare, Plus } from "lucide-react";
import { Spinner } from "../../components/ui/Spinner.js";
import { SiriOrb } from "../../components/ui/SiriOrb.js";
import type {
  InterviewAnswerFeedback,
  InterviewCoachMessage,
  InterviewDifficulty,
  InterviewQuestion,
  InterviewType,
} from "./interviewApi.js";
import { EmptyInterviewState } from "./EmptyInterviewState.js";
import { QuestionCard } from "./QuestionCard.js";
import { AnswerComposer } from "./AnswerComposer.js";
import { InterviewFeedback } from "./InterviewFeedback.js";
import { InterviewReport } from "./InterviewReport.js";

export function InterviewCoach({
  firstName,
  hasResume,
  questions,
  currentIndex,
  feedbackByIndex,
  difficulty,
  answerDraft,
  onAnswerDraftChange,
  onSubmitAnswer,
  submittingAnswer,
  answerErrorMessage,
  onNext,
  onSkip,
  onHint,
  onConcept,
  hintPending,
  onQuickStart,
  onPracticeWeakAreas,
  onNewInterview,
  coachHistory,
  coachMessage,
  onCoachMessageChange,
  onAskCoach,
  coachPending,
  coachErrorMessage,
  onNewChat,
}: {
  firstName: string | undefined;
  hasResume: boolean;
  questions: InterviewQuestion[];
  currentIndex: number;
  feedbackByIndex: Record<number, InterviewAnswerFeedback>;
  difficulty: InterviewDifficulty | "";
  answerDraft: string;
  onAnswerDraftChange: (v: string) => void;
  onSubmitAnswer: () => void;
  submittingAnswer: boolean;
  answerErrorMessage: string | null;
  onNext: () => void;
  onSkip: () => void;
  onHint: () => void;
  onConcept: () => void;
  hintPending: boolean;
  onQuickStart: (role: string, type: InterviewType) => void;
  onPracticeWeakAreas: (type: InterviewType) => void;
  onNewInterview: () => void;
  coachHistory: InterviewCoachMessage[];
  coachMessage: string;
  onCoachMessageChange: (v: string) => void;
  onAskCoach: () => void;
  coachPending: boolean;
  coachErrorMessage: string | null;
  onNewChat: () => void;
}) {
  const finished = questions.length > 0 && currentIndex >= questions.length;
  const current = !finished ? questions[currentIndex] : undefined;
  const currentFeedback = current ? feedbackByIndex[currentIndex] : undefined;

  return (
    <div className="relative flex h-[40rem] flex-col overflow-hidden rounded-panel border border-line bg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,_rgb(var(--accent)/0.08),_transparent_70%)]"
      />

      <div className="relative z-10 flex items-center gap-2 border-b border-line px-5 py-4">
        <MessagesSquare className="h-4 w-4 text-accent" />
        <span className="text-label font-semibold text-fg">AI Interview Coach</span>
        {questions.length > 0 && !finished && (
          <span className="flex items-center gap-1.5 text-caption text-fg-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" /> Interview in progress
          </span>
        )}
        <button
          type="button"
          onClick={onNewChat}
          disabled={!coachHistory.length}
          className="ml-auto flex items-center gap-1.5 rounded-control border border-line bg-surface-2 px-3 py-1.5 text-caption font-medium text-fg-muted transition-colors hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> New chat
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5">
        {questions.length === 0 ? (
          <EmptyInterviewState firstName={firstName} hasResume={hasResume} onQuickStart={onQuickStart} />
        ) : finished ? (
          <InterviewReport
            questions={questions}
            feedbackByIndex={feedbackByIndex}
            onPracticeWeakAreas={onPracticeWeakAreas}
            onNewInterview={onNewInterview}
          />
        ) : (
          current && (
            <div className="space-y-3">
              <QuestionCard
                question={current}
                index={currentIndex}
                total={questions.length}
                difficulty={difficulty}
                onHint={onHint}
                onConcept={onConcept}
                onSkip={onSkip}
                hintPending={hintPending}
              />
              {currentFeedback ? (
                <InterviewFeedback feedback={currentFeedback} onNext={onNext} isLastQuestion={currentIndex === questions.length - 1} />
              ) : (
                <>
                  <AnswerComposer value={answerDraft} onChange={onAnswerDraftChange} onSubmit={onSubmitAnswer} submitting={submittingAnswer} />
                  {answerErrorMessage && <p className="text-caption text-critical">{answerErrorMessage}</p>}
                </>
              )}
            </div>
          )
        )}

        {coachHistory.length > 0 && (
          <div className="mt-6 space-y-4 border-t border-line pt-5">
            {coachHistory.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] rounded-2xl bg-accent px-4 py-2.5 text-sm text-accent-fg">
                  {m.content}
                </div>
              ) : (
                <div key={i} className="max-w-[85%] space-y-2">
                  <div className="flex items-center gap-2">
                    <SiriOrb size={20} />
                    <span className="text-section uppercase text-fg-subtle">Interview Coach</span>
                  </div>
                  <p className="whitespace-pre-wrap pl-7 text-sm leading-relaxed text-fg">{m.content}</p>
                </div>
              ),
            )}
            {coachPending && (
              <div className="flex items-center gap-2 pl-1 text-sm text-fg-subtle">
                <Spinner className="h-3.5 w-3.5" /> Thinking…
              </div>
            )}
          </div>
        )}
      </div>

      {coachErrorMessage && <p className="relative z-10 px-5 pb-2 text-caption text-critical">{coachErrorMessage}</p>}
      <div className="relative z-10 border-t border-line px-5 py-4">
        <div className="flex items-center gap-2 rounded-pill border border-line bg-surface-2 px-2 py-2">
          <input
            className="h-9 flex-1 rounded-pill bg-transparent px-3 text-sm text-fg outline-none placeholder:text-fg-subtle"
            placeholder="Ask the coach…"
            value={coachMessage}
            onChange={(e) => onCoachMessageChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAskCoach()}
          />
          <button
            type="button"
            onClick={onAskCoach}
            disabled={!coachMessage.trim() || coachPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {coachPending ? <Spinner className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
