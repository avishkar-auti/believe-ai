import type { ExecutionResult } from "@believe-ai/shared";
import { ExecutionStatusBanner } from "./ExecutionStatusBanner.js";

export function ConsolePanel({ result }: { result: ExecutionResult | null }) {
  if (!result) {
    return <p className="text-sm text-fg-subtle">Run your code to see console output here.</p>;
  }

  return (
    <div className="space-y-3">
      <ExecutionStatusBanner message={result.message} executed={result.executed} />
      {(result.stdout || result.stderr) && (
        <pre className="overflow-x-auto rounded-control bg-surface-2 p-3 font-mono text-xs text-fg">
          {result.stdout}
          {result.stderr && <span className="text-critical">{result.stderr}</span>}
        </pre>
      )}
    </div>
  );
}
