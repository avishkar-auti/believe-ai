import { Terminal } from "lucide-react";
import { cn } from "../../lib/cn.js";
import type { RunCodeResult } from "./interviewApi.js";

type ConsoleTab = "output" | "input";

export function CodeConsole({
  activeTab,
  onTabChange,
  stdin,
  onStdinChange,
  runResult,
  runPending,
  runError,
}: {
  activeTab: ConsoleTab;
  onTabChange: (tab: ConsoleTab) => void;
  stdin: string;
  onStdinChange: (v: string) => void;
  runResult: RunCodeResult | undefined;
  runPending: boolean;
  runError: boolean;
}) {
  const success = runResult ? runResult.status.toLowerCase().includes("accepted") || runResult.status.toLowerCase().includes("success") : false;

  return (
    <div className="shrink-0 border-t border-black/20 bg-[#1e1e1e]">
      <div className="flex items-center gap-1 px-3 pt-2.5">
        <Terminal className="mr-1 h-3.5 w-3.5 text-white/40" />
        {(["output", "input"] as ConsoleTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              activeTab === tab ? "bg-[#333] text-white" : "text-white/40 hover:text-white/70",
            )}
          >
            {tab === "output" ? "Output" : "Custom Input"}
          </button>
        ))}
        {runResult && (
          <span className={cn("ml-auto pr-1 text-xs font-medium", success ? "text-lime-400" : "text-amber-400")}>
            {runResult.status}
            {runResult.timeSeconds != null && ` · Runtime ${Math.round(runResult.timeSeconds * 1000)} ms`}
            {runResult.memoryKb != null && ` · Memory ${(runResult.memoryKb / 1024).toFixed(1)} MB`}
          </span>
        )}
      </div>

      <div className="max-h-32 space-y-1.5 overflow-y-auto px-3 py-2.5">
        {activeTab === "input" ? (
          <input
            className="w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 font-mono text-xs text-white/80 outline-none placeholder:text-white/25 focus:border-white/30"
            placeholder="Custom input (stdin) — optional"
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
          />
        ) : runPending ? (
          <p className="font-mono text-xs text-white/30">Running…</p>
        ) : runError ? (
          <p className="font-mono text-xs text-red-400">Couldn't run this — the code sandbox isn't configured on this server yet.</p>
        ) : runResult ? (
          <div className="rounded-md bg-black/30 p-2 font-mono text-xs">
            {runResult.stdout && <pre className="whitespace-pre-wrap text-[#d4d4d4]">{runResult.stdout}</pre>}
            {runResult.compileOutput && <pre className="whitespace-pre-wrap text-amber-400">{runResult.compileOutput}</pre>}
            {runResult.stderr && <pre className="whitespace-pre-wrap text-red-400">{runResult.stderr}</pre>}
            {!runResult.stdout && !runResult.compileOutput && !runResult.stderr && <p className="text-white/30">No output.</p>}
          </div>
        ) : (
          <p className="font-mono text-xs text-white/30">Run your code to see output here.</p>
        )}
      </div>
    </div>
  );
}
