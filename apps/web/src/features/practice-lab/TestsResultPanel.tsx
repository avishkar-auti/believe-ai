import { Circle, CircleCheck, CircleX } from "lucide-react";
import type { ExecutionResult, TestOutcome } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { ExecutionStatusBanner } from "./ExecutionStatusBanner.js";

const OUTCOME_META: Record<TestOutcome, { icon: typeof Circle; className: string; label: string }> = {
  passed: { icon: CircleCheck, className: "text-positive", label: "passed" },
  failed: { icon: CircleX, className: "text-critical", label: "failed" },
  not_run: { icon: Circle, className: "text-fg-subtle", label: "not run" },
};

export function TestsResultPanel({ result }: { result: ExecutionResult | null }) {
  if (!result) {
    return <p className="text-sm text-fg-subtle">Run your code to see test results here.</p>;
  }

  return (
    <div className="space-y-3">
      <ExecutionStatusBanner message={result.message} executed={result.executed} />
      {result.testResults.length > 0 && (
        <ul className="space-y-1.5" aria-label="Test results">
          {result.testResults.map((t) => {
            const meta = OUTCOME_META[t.outcome];
            return (
              <li key={t.testCaseId} className="flex items-center gap-2 text-sm text-fg">
                <meta.icon className={cn("h-3.5 w-3.5 shrink-0", meta.className)} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{t.hidden ? "Hidden test" : t.name}</span>
                <span className={cn("text-caption font-medium", meta.className)}>{meta.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
