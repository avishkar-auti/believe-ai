import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Code2, MessagesSquare, Play, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { Spinner } from "../../components/ui/Spinner.js";
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
  const [targetRole, setTargetRole] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);

  const [coachMessage, setCoachMessage] = useState("");
  const [coachHistory, setCoachHistory] = useState<InterviewCoachMessage[]>([]);

  const [language, setLanguage] = useState<SandboxLanguage>("python");
  const [code, setCode] = useState(STARTER_CODE.python);

  const questionsMutation = useMutation({
    mutationFn: () => generateInterviewQuestions(targetRole || undefined),
    onSuccess: setQuestions,
  });

  const coachMutation = useMutation({
    mutationFn: (history: InterviewCoachMessage[]) => askInterviewCoach(coachMessage, history),
    onSuccess: (reply) => {
      setCoachHistory((prev) => [...prev, { role: "assistant", content: reply }]);
      setCoachMessage("");
    },
  });

  const runMutation = useMutation({
    mutationFn: () => runCode(language, code, ""),
  });

  function handleAskCoach() {
    if (!coachMessage.trim() || coachMutation.isPending) return;
    const history = coachHistory;
    setCoachHistory((prev) => [...prev, { role: "user", content: coachMessage }]);
    coachMutation.mutate(history);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
          <Sparkles className="h-5 w-5 text-brand-500" /> Interview Prep
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Practice questions, coaching feedback, and a code sandbox — grounded in your resume.
        </p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Target role (optional) — e.g. Senior Backend Engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => questionsMutation.mutate()} disabled={questionsMutation.isPending}>
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
              <div key={i} className="flex items-start gap-3 rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60">
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
        <Card>
          <CardHeader className="flex items-center gap-2">
            <MessagesSquare className="h-4 w-4 text-ink-400" />
            <span className="text-sm font-medium text-ink-900 dark:text-white">Interview coach</span>
          </CardHeader>
          <CardBody className="flex h-96 flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {coachHistory.length === 0 ? (
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  Ask for feedback on an answer, or "how should I answer questions about X?"
                </p>
              ) : (
                coachHistory.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                      m.role === "user"
                        ? "ml-auto bg-brand-500 text-white"
                        : "bg-ink-50 text-ink-800 dark:bg-ink-800 dark:text-ink-100"
                    }`}
                  >
                    {m.content}
                  </div>
                ))
              )}
              {coachMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-ink-400">
                  <Spinner className="h-3.5 w-3.5" /> Thinking…
                </div>
              )}
            </div>
            {coachMutation.isError && (
              <p className="mt-2 text-sm text-red-600">Couldn't reach the coach — upload a resume first, then try again.</p>
            )}
            <div className="mt-3 flex gap-2">
              <input
                className="h-10 flex-1 rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none focus:border-ink-900 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                placeholder="Ask the coach…"
                value={coachMessage}
                onChange={(e) => setCoachMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskCoach()}
              />
              <Button onClick={handleAskCoach} disabled={!coachMessage.trim() || coachMutation.isPending}>
                Ask
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-ink-900 dark:text-white">
              <Code2 className="h-4 w-4 text-ink-400" /> Code sandbox
            </span>
            <select
              className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-white"
              value={language}
              onChange={(e) => {
                const next = e.target.value as SandboxLanguage;
                setLanguage(next);
                setCode(STARTER_CODE[next]);
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardBody className="space-y-3">
            <textarea
              className="h-48 w-full rounded-xl border border-ink-200 bg-ink-50 p-3 font-mono text-sm text-ink-800 outline-none focus:border-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
            />
            <Button onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
              <Play className="h-4 w-4" /> {runMutation.isPending ? "Running…" : "Run"}
            </Button>
            {runMutation.isError && (
              <p className="text-sm text-red-600">
                Couldn't run this — the code sandbox isn't configured on this server yet.
              </p>
            )}
            {runMutation.data && (
              <div className="space-y-1 rounded-xl bg-ink-50 p-3 font-mono text-xs dark:bg-ink-900">
                <p className="text-ink-400">{runMutation.data.status}</p>
                {runMutation.data.stdout && <pre className="whitespace-pre-wrap text-ink-800 dark:text-ink-100">{runMutation.data.stdout}</pre>}
                {runMutation.data.compileOutput && (
                  <pre className="whitespace-pre-wrap text-amber-600">{runMutation.data.compileOutput}</pre>
                )}
                {runMutation.data.stderr && <pre className="whitespace-pre-wrap text-red-600">{runMutation.data.stderr}</pre>}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
