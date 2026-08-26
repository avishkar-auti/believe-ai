import { ChevronRight, Sparkles } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";

export function QuestionPanel({
  questionText,
  questionIndex,
  totalQuestions,
  isHost,
  onAdvance,
  onRegenerate,
  regenerating,
  disabled,
}: {
  questionText: string | null;
  questionIndex: number;
  totalQuestions: number;
  isHost: boolean;
  onAdvance: () => void;
  onRegenerate: () => void;
  regenerating?: boolean;
  disabled?: boolean;
}) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            {totalQuestions > 0 ? `Question ${questionIndex + 1} of ${totalQuestions}` : "Waiting to start"}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-ink-900 dark:text-white">
            {questionText ?? "The room isn't active yet."}
          </p>
        </div>
        {isHost && (
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onRegenerate} disabled={regenerating}>
              <Sparkles className="h-4 w-4" /> {regenerating ? "Regenerating…" : "Regenerate with AI"}
            </Button>
            <Button size="sm" variant="secondary" onClick={onAdvance} disabled={disabled}>
              Next question <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
