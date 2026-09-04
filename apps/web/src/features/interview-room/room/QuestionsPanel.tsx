import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { SectionLabel } from "../../../components/ui/Surface.js";
import { cn } from "../../../lib/cn.js";

/**
 * The flagship AI question surface. Questions, the active index and the turn
 * owner all come from the room's realtime state; the host actions call the
 * existing regenerate endpoint and the socket's advance-turn message.
 */
/** Minimal question shape the room's realtime roster/questions messages carry. */
export interface PanelQuestion {
  id: string;
  text: string;
  source?: string;
}

export function QuestionsPanel({
  questions,
  currentIndex,
  currentSpeakerName,
  isHost,
  regenerating,
  advanceDisabled,
  onAdvance,
  onRegenerate,
}: {
  questions: PanelQuestion[];
  currentIndex: number;
  currentSpeakerName: string | null;
  isHost: boolean;
  regenerating?: boolean;
  advanceDisabled?: boolean;
  onAdvance: () => void;
  onRegenerate: () => void;
}) {
  const current = questions[currentIndex] ?? null;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="surface-2 surface-edge rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>
            {questions.length > 0 ? `Question ${Math.min(currentIndex + 1, questions.length)} of ${questions.length}` : "No questions yet"}
          </SectionLabel>
          {current?.source === "ai" && (
            <span className="flex items-center gap-1 text-caption text-accent">
              <Sparkles className="h-3 w-3" aria-hidden /> AI
            </span>
          )}
        </div>

        <p className="mt-2 text-h3 leading-snug text-fg">
          {current?.text ?? "Questions appear here once the session starts."}
        </p>

        {currentSpeakerName && (
          <p className="mt-3 text-caption text-fg-muted">
            <span className="font-medium text-fg">{currentSpeakerName}</span> is answering
          </p>
        )}

        {isHost && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onRegenerate} disabled={regenerating}>
              <Sparkles className="h-3.5 w-3.5" /> {regenerating ? "Generating…" : "Regenerate with AI"}
            </Button>
            <Button size="sm" onClick={onAdvance} disabled={advanceDisabled}>
              Next turn <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {questions.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <SectionLabel className="mb-2">Question set</SectionLabel>
          <ol className="space-y-1.5">
            {questions.map((q, i) => (
              <li
                key={q.id}
                className={cn(
                  "flex gap-2.5 rounded-xl px-3 py-2 text-label",
                  i === currentIndex ? "bg-accent-soft text-fg" : "text-fg-muted",
                  i < currentIndex && "opacity-55",
                )}
              >
                <span className="tabular-nums text-fg-subtle">{i + 1}</span>
                <span className="min-w-0">{q.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
