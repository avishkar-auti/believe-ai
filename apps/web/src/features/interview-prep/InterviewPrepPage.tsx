import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowUp, ListChecks, MessagesSquare, Play, Plus, Sparkles, Target, Terminal } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { SiriOrb } from "../../components/ui/SiriOrb.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { cn } from "../../lib/cn.js";
import {
  askInterviewCoach,
  generateInterviewQuestions,
  runCode,
  type InterviewCoachMessage,
  type InterviewQuestion,
  type InterviewQuestionCategory,
  type SandboxLanguage,
} from "./interviewApi.js";

const CATEGORY_TONE: Record<InterviewQuestionCategory, "info" | "success" | "warning" | "neutral"> = {
  behavioral: "info",
  technical: "success",
  system_design: "warning",
  coding: "neutral",
};

const LANGUAGES: SandboxLanguage[] = ["python", "javascript", "java", "cpp", "go"];

const STARTER_CODE: Record<SandboxLanguage, string> = {
  python: 'print("hello, believe.ai")',
  javascript: 'console.log("hello, believe.ai");',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("hello, believe.ai");\n  }\n}',
  cpp: '#include <iostream>\nint main() {\n  std::cout << "hello, believe.ai";\n  return 0;\n}',
  go: 'package main\nimport "fmt"\nfunc main() {\n  fmt.Println("hello, believe.ai")\n}',
};

export function InterviewPrepPage() {
  const { data: user } = useCurrentUser();
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const [targetRole, setTargetRole] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);

  const [coachMessage, setCoachMessage] = useState("");
  const [coachHistory, setCoachHistory] = useState<InterviewCoachMessage[]>([]);

  const [language, setLanguage] = useState<SandboxLanguage>("python");
  const [code, setCode] = useState(STARTER_CODE.python);
  const [stdin, setStdin] = useState("");

  const questionsMutation = useMutation({
    mutationFn: () => generateInterviewQuestions(targetRole || undefined),
    onSuccess: setQuestions,
  });

  const coachMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: InterviewCoachMessage[] }) => askInterviewCoach(message, history),
    onSuccess: (reply) => {
      setCoachHistory((prev) => [...prev, { role: "assistant", content: reply }]);
      setCoachMessage("");
    },
  });

  const runMutation = useMutation({
    mutationFn: () => runCode(language, code, stdin),
  });

  const lineCount = code.split("\n").length;

  const coachStarters = [
    `Help me introduce myself${targetRole.trim() ? ` for a ${targetRole.trim()} interview` : ""}.`,
    "Give feedback on my interview answer.",
    "What experience should I emphasize in an interview?",
  ];

  function handleAskCoach(message = coachMessage) {
    const prompt = message.trim();
    if (!prompt || coachMutation.isPending) return;
    const history = coachHistory;
    setCoachHistory((prev) => [...prev, { role: "user", content: prompt }]);
    coachMutation.mutate({ message: prompt, history });
  }

  return (
    <div className="mx-auto max-w-content space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200/80 pb-5 dark:border-ink-700">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_8px_20px_-8px_rgba(67,83,255,.8)]"><Sparkles className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">Practice workspace</p><h1 className="text-title font-semibold text-ink-900 dark:text-white">Interview prep</h1></div></div>
        <p className="text-xs text-ink-400">Grounded in your uploaded resume</p>
      </div>

      <Card className="rounded-panel transition duration-200 hover:shadow-lift">
        <CardBody className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Target role (optional) — e.g. Senior Backend Engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => questionsMutation.mutate()} disabled={questionsMutation.isPending}>
            <Target className="h-4 w-4" />
            {questionsMutation.isPending ? "Generating…" : "Generate questions"}
          </Button>
        </CardBody>
        {questionsMutation.isError && (
          <CardBody className="pt-0">
            <p className="text-sm text-red-600">Couldn't generate questions — upload a resume first, then try again.</p>
          </CardBody>
        )}
        {questions.length > 0 && (
          <CardBody className="space-y-2 pt-0">
            {questions.map((q, i) => (
              <div key={i} className="group flex items-start gap-3 rounded-2xl border border-transparent bg-ink-50 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-card dark:bg-ink-800/60 dark:hover:bg-ink-800">
                <Badge tone={CATEGORY_TONE[q.category]} className="mt-0.5 shrink-0">
                  {q.category.replace("_", " ")}
                </Badge>
                <p className="text-sm text-ink-700 dark:text-ink-200">{q.question}</p>
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Interview coach — Siri-style canvas that follows the app's light/dark theme; only the orb itself stays fixed-dark */}
        <div className="relative flex h-[34rem] flex-col overflow-hidden rounded-panel bg-white shadow-lift dark:bg-black">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,_rgba(67,83,255,0.08),_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.18),_transparent_70%)]"
          />

          <div className="relative z-10 flex items-center gap-2 border-b border-ink-100 px-5 py-4 dark:border-white/10">
            <MessagesSquare className="h-4 w-4 text-brand-500 dark:text-brand-400" />
            <span className="text-sm font-semibold text-ink-900 dark:text-white">Interview coach</span>
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto border-ink-200 bg-ink-50 text-ink-700 hover:bg-ink-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              onClick={() => setCoachHistory([])}
              disabled={!coachHistory.length}
            >
              <Plus className="h-4 w-4" /> New chat
            </Button>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5">
            {coachHistory.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
                <SiriOrb size={72} />
                <div>
                  <p className="bg-gradient-to-b from-ink-900 to-ink-700 bg-clip-text text-lg font-semibold text-transparent dark:from-white dark:to-white/70">
                    Hi{firstName ? `, ${firstName}` : ""} 👋
                  </p>
                  <p className="mt-1 text-sm text-ink-500 dark:text-white/50">
                    Use your resume as the foundation, then practise the answers that matter most.
                  </p>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl border border-ink-100 bg-ink-50 p-3 text-left dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-white/40">
                      <Target className="h-3.5 w-3.5" /> Target role
                    </div>
                    <p className="mt-2 truncate text-sm font-medium text-ink-900 dark:text-white">{targetRole.trim() || "Any role"}</p>
                  </div>

                  <div className="rounded-2xl border border-ink-100 bg-ink-50 p-3 text-left dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-white/40">
                      <ListChecks className="h-3.5 w-3.5" /> Questions
                    </div>
                    <p className="mt-2 text-xl font-semibold text-ink-900 dark:text-white">{questions.length}</p>
                    <p className="text-xs text-ink-500 dark:text-white/50">generated so far</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAskCoach(coachStarters[0])}
                    disabled={coachMutation.isPending}
                    className="rounded-2xl border border-ink-100 bg-ink-50 p-3 text-left transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-sm dark:hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-white/40">
                      <Sparkles className="h-3.5 w-3.5" /> Suggested
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-ink-700 dark:text-white/80">{coachStarters[0]}</p>
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {coachStarters.slice(1).map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => handleAskCoach(starter)}
                      disabled={coachMutation.isPending}
                      className="rounded-pill border border-ink-100 bg-ink-50 px-3 py-1.5 text-xs text-ink-600 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/10"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {coachHistory.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="ml-auto max-w-[85%] rounded-2xl bg-brand-500 px-4 py-2.5 text-sm text-white">
                      {m.content}
                    </div>
                  ) : (
                    <div key={i} className="max-w-[85%] space-y-2">
                      <div className="flex items-center gap-2">
                        <SiriOrb size={20} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-white/40">
                          Interview Coach
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap pl-7 text-sm leading-relaxed text-ink-800 dark:text-white/90">{m.content}</p>
                    </div>
                  ),
                )}
                {coachMutation.isPending && (
                  <div className="flex items-center gap-2 pl-1 text-sm text-ink-400 dark:text-white/40">
                    <Spinner className="h-3.5 w-3.5" /> Thinking…
                  </div>
                )}
              </div>
            )}
          </div>

          {coachMutation.isError && (
            <p className="relative z-10 px-5 pb-2 text-sm text-red-500 dark:text-red-400">
              Couldn't reach the coach — upload a resume first, then try again.
            </p>
          )}
          <div className="relative z-10 border-t border-ink-100 px-5 py-4 dark:border-white/10">
            <div className="flex items-center gap-2 rounded-pill border border-ink-200 bg-ink-50 px-2 py-2 dark:border-white/10 dark:bg-white/[0.06] dark:backdrop-blur-sm">
              <input
                className="h-9 flex-1 rounded-pill bg-transparent px-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 disabled:cursor-not-allowed dark:text-white dark:placeholder:text-white/35"
                placeholder="Ask the coach…"
                value={coachMessage}
                onChange={(e) => setCoachMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskCoach()}
              />
              <button
                type="button"
                onClick={() => handleAskCoach()}
                disabled={!coachMessage.trim() || coachMutation.isPending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-all hover:scale-105 hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {coachMutation.isPending ? <Spinner className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <Card className="flex h-[34rem] flex-col overflow-hidden rounded-panel transition duration-200 hover:shadow-lift">
          {/* Editor toolbar — language tabs + run button, LeetCode-style */}
          <div className="flex shrink-0 items-center justify-between border-b border-black/20 bg-[#1e1e1e] px-3 py-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLanguage(l);
                    setCode(STARTER_CODE[l]);
                  }}
                  className={cn(
                    "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    language === l ? "bg-[#333] text-white" : "text-ink-400 hover:text-ink-200",
                  )}
                >
                  {l === "cpp" ? "C++" : l}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="bg-lime-500 text-ink-900 hover:bg-lime-400 disabled:bg-lime-500/50"
            >
              <Play className="h-3.5 w-3.5" /> {runMutation.isPending ? "Running…" : "Run"}
            </Button>
          </div>

          {/* Editor body — dark, with a real line-number gutter, grows to fill remaining space */}
          <div className="flex flex-1 overflow-y-auto bg-[#1e1e1e]">
            <div
              aria-hidden="true"
              className="select-none px-3 py-3 text-right font-mono text-xs leading-5 text-white/25"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              className="flex-1 resize-none bg-transparent py-3 pr-3 font-mono text-sm leading-5 text-[#d4d4d4] outline-none"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
            />
          </div>

          {/* Console — stdin + run result */}
          <div className="shrink-0 space-y-2 border-t border-black/20 bg-[#1e1e1e] px-3 py-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
                <Terminal className="h-3.5 w-3.5" /> Console
              </span>
              {runMutation.data && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    runMutation.data.status.toLowerCase().includes("accepted") ||
                      runMutation.data.status.toLowerCase().includes("success")
                      ? "text-lime-400"
                      : "text-amber-400",
                  )}
                >
                  {runMutation.data.status}
                  {runMutation.data.timeSeconds != null && ` · ${runMutation.data.timeSeconds}s`}
                  {runMutation.data.memoryKb != null && ` · ${runMutation.data.memoryKb}KB`}
                </span>
              )}
            </div>

            <input
              className="w-full rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 font-mono text-xs text-white/80 outline-none placeholder:text-white/25 focus:border-white/30"
              placeholder="Custom input (stdin) — optional"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
            />

            {runMutation.isError && (
              <p className="font-mono text-xs text-red-400">
                Couldn't run this — the code sandbox isn't configured on this server yet.
              </p>
            )}
            {runMutation.data && (
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-md bg-black/30 p-2 font-mono text-xs">
                {runMutation.data.stdout && (
                  <pre className="whitespace-pre-wrap text-[#d4d4d4]">{runMutation.data.stdout}</pre>
                )}
                {runMutation.data.compileOutput && (
                  <pre className="whitespace-pre-wrap text-amber-400">{runMutation.data.compileOutput}</pre>
                )}
                {runMutation.data.stderr && <pre className="whitespace-pre-wrap text-red-400">{runMutation.data.stderr}</pre>}
                {!runMutation.data.stdout && !runMutation.data.compileOutput && !runMutation.data.stderr && (
                  <p className="text-white/30">No output.</p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
