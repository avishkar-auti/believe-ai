import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Target } from "lucide-react";
import { cn } from "../../lib/cn.js";
import { Badge } from "../../components/ui/Badge.js";
import { SectionLabel } from "../../components/ui/Surface.js";
import type {
  InterviewAnswerFeedback,
  InterviewDifficulty,
  InterviewQuestion,
  InterviewQuestionCategory,
  InterviewSessionSummary,
} from "./interviewApi.js";
import { ResumeContextBadge } from "./ResumeContextBadge.js";

const CATEGORY_LABEL: Record<InterviewQuestionCategory, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  system_design: "System Design",
  coding: "Coding",
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Live elapsed-time ticker — genuinely real (wall-clock since the session
 * started), not a fabricated countdown. Stops updating once the session
 * finishes since sessionStartedAt no longer matters. */
function useElapsed(startedAt: number | null, active: boolean): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || !active) return;
    setNow(Date.now()); // correct immediately when the session (re)starts, don't wait for the first tick
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt, active]);

  if (!startedAt) return null;
  return formatDuration(Math.max(0, now - startedAt));
}

function scoreTone(score: number): "success" | "warning" | "danger" {
  if (score >= 70) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

const SESSION_DATE_FORMAT = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

export function InterviewSidebar({
  targetRole,
  resumeLabel,
  questions,
  currentIndex,
  feedbackByIndex,
  difficulty,
  sessionStartedAt,
  sessions,
}: {
  targetRole: string;
  resumeLabel: string | null;
  questions: InterviewQuestion[];
  currentIndex: number;
  feedbackByIndex: Record<number, InterviewAnswerFeedback>;
  difficulty: InterviewDifficulty | "";
  sessionStartedAt: number | null;
  sessions: InterviewSessionSummary[] | undefined;
}) {
  const sessionActive = questions.length > 0;
  const finished = sessionActive && currentIndex >= questions.length;
  const elapsed = useElapsed(sessionStartedAt, sessionActive && !finished);

  // First-appearance order, not alphabetical — matches the order the
  // candidate will actually encounter them in.
  const categories: InterviewQuestionCategory[] = [];
  for (const q of questions) if (!categories.includes(q.category)) categories.push(q.category);

  function categoryState(category: InterviewQuestionCategory): "done" | "current" | "upcoming" {
    const indices = questions.map((q, i) => (q.category === category ? i : -1)).filter((i) => i >= 0);
    const allAnswered = indices.every((i) => feedbackByIndex[i] != null);
    if (allAnswered) return "done";
    if (indices.includes(currentIndex) && !finished) return "current";
    return "upcoming";
  }

  return (
    <div className="space-y-5">
      <div className="rounded-panel border border-line bg-surface p-4">
        <SectionLabel>Interview session</SectionLabel>
        <div className="mt-3 space-y-3">
          <div>
            <p className="flex items-center gap-1.5 text-caption text-fg-subtle">
              <Target className="h-3.5 w-3.5" /> Target
            </p>
            <p className="mt-0.5 truncate text-label font-medium text-fg">{targetRole.trim() || "Any role"}</p>
          </div>

          {sessionActive && (
            <div>
              <div className="flex items-center justify-between text-caption text-fg-subtle">
                <span>Progress</span>
                <span>
                  Question {Math.min(currentIndex + 1, questions.length)} of {questions.length}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-surface-2">
                <div
                  className="h-full rounded-pill bg-accent transition-all duration-300"
                  style={{ width: `${Math.min(100, (currentIndex / questions.length) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-caption text-fg-subtle">Difficulty</p>
              <p className="mt-0.5 text-label font-medium capitalize text-fg">{difficulty || "Any"}</p>
            </div>
            {elapsed && (
              <div>
                <p className="text-caption text-fg-subtle">Duration</p>
                <p className="mt-0.5 font-mono text-label font-medium text-fg">{elapsed}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-panel border border-line bg-surface p-4">
        <SectionLabel>Question categories</SectionLabel>
        {categories.length === 0 ? (
          <p className="mt-2 text-caption text-fg-muted">Generate an interview to see your session outline here.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {categories.map((category) => {
              const state = categoryState(category);
              return (
                <li key={category} className="flex items-center gap-2 text-label">
                  {state === "done" && <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" />}
                  {state === "current" && <Circle className="h-4 w-4 shrink-0 fill-accent text-accent" />}
                  {state === "upcoming" && <Circle className="h-4 w-4 shrink-0 text-fg-subtle" />}
                  <span className={cn(state === "upcoming" ? "text-fg-muted" : "text-fg")}>{CATEGORY_LABEL[category]}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {resumeLabel && <ResumeContextBadge resumeLabel={resumeLabel} />}

      {sessions && sessions.length > 0 && (
        <div className="rounded-panel border border-line bg-surface p-4">
          <SectionLabel>Session history</SectionLabel>
          <ul className="mt-3 space-y-2.5">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 text-caption">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{s.targetRole?.trim() || "General practice"}</p>
                  <p className="text-fg-subtle">
                    {SESSION_DATE_FORMAT.format(new Date(s.completedAt))} · {s.answeredCount}/{s.totalQuestions} answered
                  </p>
                </div>
                {s.overallScore != null ? (
                  <Badge tone={scoreTone(s.overallScore)} className="shrink-0">
                    {s.overallScore}%
                  </Badge>
                ) : (
                  <Badge tone="neutral" className="shrink-0">
                    Not scored
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
