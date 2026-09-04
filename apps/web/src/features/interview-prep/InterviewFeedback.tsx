import { useState } from "react";
import { ChevronDown, ChevronUp, TriangleAlert, CircleCheck } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { cn } from "../../lib/cn.js";
import type { InterviewAnswerFeedback } from "./interviewApi.js";

const METRICS: { key: keyof InterviewAnswerFeedback; label: string }[] = [
  { key: "technicalAccuracy", label: "Technical accuracy" },
  { key: "clarity", label: "Clarity" },
  { key: "depth", label: "Depth" },
  { key: "communication", label: "Communication" },
];

function scoreLabel(score: number): string {
  if (score >= 85) return "Strong performance";
  if (score >= 70) return "Solid performance";
  if (score >= 50) return "Needs work";
  return "Significant gaps";
}

export function InterviewFeedback({
  feedback,
  onNext,
  isLastQuestion,
}: {
  feedback: InterviewAnswerFeedback;
  onNext: () => void;
  isLastQuestion: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-4 rounded-panel border border-line bg-surface-2 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-4 border-accent/20 bg-surface">
          <span className="text-h3 font-bold text-fg">{feedback.overallScore}</span>
          <span className="text-[0.6rem] text-fg-subtle">/ 100</span>
        </div>
        <div>
          <p className="text-label font-semibold text-fg">{scoreLabel(feedback.overallScore)}</p>
          <p className="text-caption text-fg-muted">Overall answer score</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {METRICS.map((m) => {
          const value = feedback[m.key] as number;
          return (
            <div key={m.key}>
              <div className="flex items-center justify-between text-caption">
                <span className="text-fg-muted">{m.label}</span>
                <span className="font-medium text-fg">{value}</span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-pill bg-surface-3">
                <div className="h-full rounded-pill bg-accent" style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {feedback.strengths.length > 0 && (
        <div>
          <p className="text-section uppercase text-fg-subtle">What you did well</p>
          <ul className="mt-1.5 space-y-1">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-caption text-fg">
                <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.improvements.length > 0 && (
        <div>
          <p className="text-section uppercase text-fg-subtle">Improve</p>
          <ul className="mt-1.5 space-y-1">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-caption text-fg">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-line pt-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-caption font-medium text-accent hover:text-accent-hover"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Hide stronger answer" : "See stronger answer"}
        </button>
        {expanded && (
          <p className={cn("mt-2 whitespace-pre-wrap rounded-control bg-surface p-3 text-caption leading-relaxed text-fg-muted")}>
            {feedback.suggestedAnswer}
          </p>
        )}
      </div>

      <Button onClick={onNext} className="w-full">
        {isLastQuestion ? "View report" : "Next question"} →
      </Button>
    </div>
  );
}
