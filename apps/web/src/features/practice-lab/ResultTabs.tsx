import { useState } from "react";
import type { ExecutionResult } from "@believe-ai/shared";
import { Tabs } from "../../components/ui/Tabs.js";
import { TestsResultPanel } from "./TestsResultPanel.js";
import { ConsolePanel } from "./ConsolePanel.js";

const TABS = [
  { value: "tests", label: "Tests" },
  { value: "console", label: "Console" },
];

export function ResultTabs({ result }: { result: ExecutionResult | null }) {
  const [tab, setTab] = useState("tests");

  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="border-b border-line px-2">
        <Tabs ariaLabel="Execution results" items={TABS} value={tab} onChange={setTab} />
      </div>
      <div className="p-4">{tab === "tests" ? <TestsResultPanel result={result} /> : <ConsolePanel result={result} />}</div>
    </div>
  );
}
