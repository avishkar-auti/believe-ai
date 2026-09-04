import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Code2, Play, RotateCcw } from "lucide-react";
import { Spinner } from "../../components/ui/Spinner.js";
import { cn } from "../../lib/cn.js";
import type { RunCodeResult, SandboxLanguage } from "./interviewApi.js";
import { CodeConsole } from "./CodeConsole.js";
import { LANGUAGES, STARTER_CODE } from "./sandboxConstants.js";

const MONACO_LANGUAGE: Record<SandboxLanguage, string> = {
  python: "python",
  javascript: "javascript",
  java: "java",
  cpp: "cpp",
  go: "go",
};

export function CodingWorkspace({
  language,
  onLanguageChange,
  code,
  onCodeChange,
  stdin,
  onStdinChange,
  onRun,
  runPending,
  runResult,
  runError,
  isCodingQuestion,
  onSendAsAnswer,
  sendingAsAnswer,
}: {
  language: SandboxLanguage;
  onLanguageChange: (l: SandboxLanguage) => void;
  code: string;
  onCodeChange: (v: string) => void;
  stdin: string;
  onStdinChange: (v: string) => void;
  onRun: () => void;
  runPending: boolean;
  runResult: RunCodeResult | undefined;
  runError: boolean;
  isCodingQuestion: boolean;
  onSendAsAnswer: () => void;
  sendingAsAnswer: boolean;
}) {
  const [consoleTab, setConsoleTab] = useState<"output" | "input">("output");

  return (
    <div className="flex h-[40rem] flex-col overflow-hidden rounded-panel border border-line bg-surface">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <span className="text-label font-semibold text-fg">Coding workspace</span>
        {isCodingQuestion && (
          <button
            type="button"
            onClick={onSendAsAnswer}
            disabled={sendingAsAnswer || !code.trim()}
            className="flex items-center gap-1.5 rounded-pill bg-accent-soft px-3 py-1 text-caption font-medium text-accent transition-colors hover:bg-accent-soft/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Code2 className="h-3.5 w-3.5" /> {sendingAsAnswer ? "Sending…" : "Send code as answer"}
          </button>
        )}
      </div>

      {/* Editor toolbar — language tabs + reset/run, LeetCode-style. Dark
          always, independent of the app's light/dark theme (see CodeEditor
          in practice-lab for the theme-following variant used there). */}
      <div className="flex shrink-0 items-center justify-between border-b border-black/20 bg-[#1e1e1e] px-3 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLanguageChange(l)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                language === l ? "bg-[#333] text-white" : "text-white/40 hover:text-white/70",
              )}
            >
              {l === "cpp" ? "C++" : l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onCodeChange(STARTER_CODE[language])}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white/80"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button
            type="button"
            onClick={onRun}
            disabled={runPending}
            className="flex items-center gap-1.5 rounded-md bg-lime-500 px-2.5 py-1 text-xs font-semibold text-ink-900 transition-colors hover:bg-lime-400 disabled:bg-lime-500/50"
          >
            {runPending ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {runPending ? "Running…" : "Run"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
        <Editor
          language={MONACO_LANGUAGE[language]}
          value={code}
          theme="vs-dark"
          onChange={(v) => onCodeChange(v ?? "")}
          options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 12 }, scrollBeyondLastLine: false, automaticLayout: true }}
          loading={
            <div className="flex h-full items-center justify-center">
              <Spinner className="h-5 w-5 text-white/40" />
            </div>
          }
        />
      </div>

      <CodeConsole
        activeTab={consoleTab}
        onTabChange={setConsoleTab}
        stdin={stdin}
        onStdinChange={onStdinChange}
        runResult={runResult}
        runPending={runPending}
        runError={runError}
      />
    </div>
  );
}
