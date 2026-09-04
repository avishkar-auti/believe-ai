import { FlaskConical, History, Play, Send } from "lucide-react";
import type { ExecutionResult } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { Badge } from "../../components/ui/Badge.js";

export function WorkspaceToolbar({
  lastResult,
  onRun,
  onEvaluate,
  onSubmit,
  onShowHistory,
  running,
  evaluating,
  submitting,
}: {
  // Which engine actually ran varies per challenge and per server
  // configuration — the badge reflects the last real response rather than
  // guessing upfront, so it's never wrong.
  lastResult: ExecutionResult | null;
  onRun: () => void;
  onEvaluate: () => void;
  onSubmit: () => void;
  onShowHistory: () => void;
  running: boolean;
  evaluating: boolean;
  submitting: boolean;
}) {
  const busy = running || evaluating || submitting;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line bg-surface-2 px-4 py-3">
      <div className="flex items-center gap-2.5">
        {lastResult &&
          (lastResult.executed ? (
            <Badge tone="success">Ran for real — Judge0 sandbox</Badge>
          ) : (
            <Badge tone="warning">Preview execution — not a real sandbox yet</Badge>
          ))}
        <button
          type="button"
          onClick={onShowHistory}
          className="flex items-center gap-1 text-caption font-medium text-fg-subtle transition-colors hover:text-fg"
        >
          <History className="h-3.5 w-3.5" /> History
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onRun} disabled={busy}>
          {running ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} Run
        </Button>
        <Button variant="secondary" size="sm" onClick={onEvaluate} disabled={busy}>
          {evaluating ? <Spinner className="h-3.5 w-3.5" /> : <FlaskConical className="h-3.5 w-3.5" />} Evaluate
        </Button>
        <Button size="sm" onClick={onSubmit} disabled={busy}>
          {submitting ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />} Submit
        </Button>
      </div>
    </div>
  );
}
