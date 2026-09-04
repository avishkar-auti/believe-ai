import { CircleCheck, TriangleAlert, Trophy } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { SectionLabel } from "../../components/ui/Surface.js";
import type { InterviewAnswerFeedback, InterviewQuestion, InterviewQuestionCategory, InterviewType } from "./interviewApi.js";

const CATEGORY_LABEL: Record<InterviewQuestionCategory, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  system_design: "System Design",
  coding: "Coding",
};

function avg(values: number[]): number {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
}

function dedupeTop(items: string[], count: number): string[] {
  return Array.from(new Set(items)).slice(0, count);
}

export function InterviewReport({
  questions,
  feedbackByIndex,
  onPracticeWeakAreas,
  onNewInterview,
}: {
  questions: InterviewQuestion[];
  feedbackByIndex: Record<number, InterviewAnswerFeedback>;
  onPracticeWeakAreas: (type: InterviewType) => void;
  onNewInterview: () => void;
}) {
  const answered = Object.entries(feedbackByIndex).map(([index, feedback]) => ({
    category: questions[Number(index)]?.category,
    feedback,
  }));

  if (answered.length === 0) {
    return (
      <div className="rounded-panel border border-line bg-surface-2 p-6 text-center">
        <p className="text-label font-medium text-fg">Session complete — no questions were answered.</p>
        <p className="mt-1 text-caption text-fg-muted">Skip fewer questions next time to get a real performance report.</p>
        <Button onClick={onNewInterview} className="mt-4">
          Start new interview
        </Button>
      </div>
    );
  }

  const overallScore = avg(answered.map((a) => a.feedback.overallScore));
  const technical = avg(answered.map((a) => a.feedback.technicalAccuracy));
  const communication = avg(answered.map((a) => a.feedback.communication));
  const depth = avg(answered.map((a) => a.feedback.depth));
  const clarity = avg(answered.map((a) => a.feedback.clarity));

  const strengths = dedupeTop(
    answered.flatMap((a) => a.feedback.strengths),
    5,
  );
  const improvements = dedupeTop(
    answered.flatMap((a) => a.feedback.improvements),
    5,
  );

  // Real per-category averages from this session's actual answers — the
  // weakest categories become the recommendation, nothing pre-scripted.
  const byCategory = new Map<InterviewQuestionCategory, number[]>();
  for (const a of answered) {
    if (!a.category) continue;
    const arr = byCategory.get(a.category) ?? [];
    arr.push(a.feedback.overallScore);
    byCategory.set(a.category, arr);
  }
  const weakest = Array.from(byCategory.entries())
    .map(([category, scores]) => ({ category, score: avg(scores) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return (
    <div className="space-y-5 rounded-panel border border-line bg-surface-2 p-5">
      <div className="text-center">
        <Trophy className="mx-auto h-8 w-8 text-accent" />
        <h2 className="mt-2 text-h2 text-fg">Interview complete</h2>
        <p className="mt-2 text-headline text-fg">{overallScore}<span className="text-label text-fg-subtle"> / 100</span></p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Technical", value: technical },
          { label: "Depth", value: depth },
          { label: "Clarity", value: clarity },
          { label: "Communication", value: communication },
        ].map((m) => (
          <div key={m.label} className="rounded-control border border-line bg-surface p-2.5 text-center">
            <p className="text-h3 text-fg">{m.value}</p>
            <p className="text-caption text-fg-muted">{m.label}</p>
          </div>
        ))}
      </div>

      {strengths.length > 0 && (
        <div>
          <SectionLabel>Strengths</SectionLabel>
          <ul className="mt-1.5 space-y-1">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-caption text-fg">
                <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" /> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div>
          <SectionLabel>Areas to improve</SectionLabel>
          <ul className="mt-1.5 space-y-1">
            {improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-caption text-fg">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution" /> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {weakest.length > 0 && (
        <div>
          <SectionLabel>Recommended next practice</SectionLabel>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {weakest.map((w) => (
              <button
                key={w.category}
                type="button"
                onClick={() => onPracticeWeakAreas(w.category)}
                className="rounded-pill border border-line bg-surface px-3 py-1.5 text-caption font-medium text-fg transition-colors hover:border-accent hover:text-accent"
              >
                {CATEGORY_LABEL[w.category]} interview
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-line pt-4">
        <Button onClick={() => onPracticeWeakAreas(weakest[0]?.category ?? "mixed")} className="flex-1">
          Practice weak areas
        </Button>
        <Button onClick={onNewInterview} variant="secondary" className="flex-1">
          Start new interview
        </Button>
      </div>
    </div>
  );
}
