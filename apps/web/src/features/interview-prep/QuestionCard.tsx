import { Code2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge.js";
import type { InterviewDifficulty, InterviewQuestion, InterviewQuestionCategory } from "./interviewApi.js";

const CATEGORY_TONE: Record<InterviewQuestionCategory, "info" | "success" | "warning" | "neutral"> = {
  behavioral: "info",
  technical: "success",
  system_design: "warning",
  coding: "neutral",
};

const CATEGORY_LABEL: Record<InterviewQuestionCategory, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  system_design: "System Design",
  coding: "Coding",
};

export function QuestionCard({
  question,
  index,
  total,
  difficulty,
  onHint,
  onConcept,
  onSkip,
  hintPending,
}: {
  question: InterviewQuestion;
  index: number;
  total: number;
  difficulty: InterviewDifficulty | "";
  onHint: () => void;
  onConcept: () => void;
  onSkip: () => void;
  hintPending: boolean;
}) {
  return (
    <div className="rounded-panel border border-line bg-surface-2 p-4">
      <div className="flex items-center justify-between text-caption text-fg-subtle">
        <span>
          Question {index + 1} of {total}
        </span>
        <div className="flex items-center gap-1.5">
          <Badge tone={CATEGORY_TONE[question.category]}>{CATEGORY_LABEL[question.category]}</Badge>
          {question.category === "coding" && (
            <Badge tone="accent">
              <Code2 className="mr-1 h-3 w-3" /> Solve in editor
            </Badge>
          )}
        </div>
      </div>

      <p className="mt-3 text-label leading-relaxed text-fg">{question.question}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-subtle">
        {difficulty && <span className="capitalize">Difficulty: {difficulty}</span>}
        <span>Expected answer: 2–4 min</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-caption font-medium">
        <button type="button" onClick={onHint} disabled={hintPending} className="text-accent hover:text-accent-hover disabled:opacity-50">
          {hintPending ? "Thinking…" : "Need a hint"}
        </button>
        <button type="button" onClick={onConcept} disabled={hintPending} className="text-fg-muted hover:text-fg disabled:opacity-50">
          View concept
        </button>
        <button type="button" onClick={onSkip} className="ml-auto text-fg-subtle hover:text-fg">
          Skip question
        </button>
      </div>
    </div>
  );
}
