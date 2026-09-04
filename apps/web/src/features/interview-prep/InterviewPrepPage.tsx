import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { ApiError } from "../../lib/apiClient.js";
import { cn } from "../../lib/cn.js";
import { Tabs, type TabItem } from "../../components/ui/Tabs.js";
import { fetchResumes } from "../resumes/resumeApi.js";
import {
  askInterviewCoach,
  completeInterviewSession,
  fetchInterviewSessions,
  generateInterviewQuestions,
  getAnswerFeedback,
  runCode,
  type InterviewCoachMessage,
  type InterviewQuestionCategory,
  type InterviewType,
  type SandboxLanguage,
} from "./interviewApi.js";
import { useInterviewSessionStore } from "./interviewSessionStore.js";
import { InterviewHeader } from "./InterviewHeader.js";
import { InterviewConfigBar } from "./InterviewConfigBar.js";
import { InterviewSidebar } from "./InterviewSidebar.js";
import { InterviewCoach } from "./InterviewCoach.js";
import { CodingWorkspace } from "./CodingWorkspace.js";
import { STARTER_CODE } from "./sandboxConstants.js";

/** ApiError.message is already a safe, user-facing string for a rate-limit
 * rejection specifically (see core/rate_limit.py) — worth showing verbatim
 * since it tells the person when to come back. Anything else (network error,
 * unexpected 500) falls back to a generic message rather than risking a
 * raw/technical one reaching the screen. */
function mutationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.code === "PLAN_LIMIT_EXCEEDED") return error.message;
  return fallback;
}

type MobileTab = "interview" | "code" | "progress";
const MOBILE_TABS: TabItem[] = [
  { value: "interview", label: "Interview" },
  { value: "code", label: "Code" },
  { value: "progress", label: "Progress" },
];

interface JobBoardHandoffState {
  targetRole?: string;
  resumeId?: string;
  jobTitle?: string;
  jobCompany?: string;
  jobDescription?: string;
}

export function InterviewPrepPage() {
  const { data: user } = useCurrentUser();
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const queryClient = useQueryClient();
  const location = useLocation();

  const {
    targetRole,
    resumeId,
    interviewType,
    difficulty,
    questions,
    currentIndex,
    feedbackByIndex,
    sessionStartedAt,
    setTargetRole,
    setResumeId,
    setInterviewType,
    setDifficulty,
    startSession,
    recordFeedback,
    nextQuestion,
  } = useInterviewSessionStore();

  // Set once from a Job Board "Interview Prep" deep-link (see features/jobs/CareerActions.tsx)
  // — read on first render only, so it survives even though targetRole/resumeId then live in
  // the shared Zustand store rather than component state.
  const [jobContext] = useState<Pick<JobBoardHandoffState, "jobTitle" | "jobCompany" | "jobDescription">>(() => {
    const state = location.state as JobBoardHandoffState | null;
    return { jobTitle: state?.jobTitle, jobCompany: state?.jobCompany, jobDescription: state?.jobDescription };
  });

  const [mobileTab, setMobileTab] = useState<MobileTab>("interview");
  const [answerDraft, setAnswerDraft] = useState("");
  const [coachMessage, setCoachMessage] = useState("");
  const [coachHistory, setCoachHistory] = useState<InterviewCoachMessage[]>([]);
  const [language, setLanguage] = useState<SandboxLanguage>("python");
  const [code, setCode] = useState(STARTER_CODE.python);
  const [stdin, setStdin] = useState("");

  const { data: resumes } = useQuery({ queryKey: ["resumes"], queryFn: fetchResumes });
  const selectedResumeId = resumeId || resumes?.find((r) => r.isPrimary)?.id;
  const selectedResume = resumes?.find((r) => r.id === selectedResumeId);

  const { data: sessionsPage } = useQuery({ queryKey: ["interview-sessions"], queryFn: () => fetchInterviewSessions() });

  useEffect(() => setAnswerDraft(""), [currentIndex]);

  useEffect(() => {
    const state = location.state as JobBoardHandoffState | null;
    if (state?.targetRole) setTargetRole(state.targetRole);
    if (state?.resumeId) setResumeId(state.resumeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once from arrival state, not on every navigation
  }, []);

  const questionsMutation = useMutation({
    mutationFn: (overrides: { role?: string; type?: InterviewType }) =>
      generateInterviewQuestions(
        (overrides.role ?? targetRole).trim() || undefined,
        selectedResumeId,
        overrides.type ?? interviewType,
        difficulty || undefined,
        jobContext.jobTitle,
        jobContext.jobCompany,
        jobContext.jobDescription,
      ),
    onSuccess: startSession,
  });

  const answerFeedbackMutation = useMutation({
    mutationFn: ({ question, category, answer }: { question: string; category: InterviewQuestionCategory; answer: string }) =>
      getAnswerFeedback(question, category, answer, targetRole.trim() || undefined, selectedResumeId),
    onSuccess: (feedback) => recordFeedback(currentIndex, feedback),
  });

  const coachMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: InterviewCoachMessage[] }) =>
      askInterviewCoach(message, history, selectedResumeId),
    onSuccess: (reply) => {
      setCoachHistory((prev) => [...prev, { role: "assistant", content: reply }]);
      setCoachMessage("");
    },
  });

  const runMutation = useMutation({
    mutationFn: () => runCode(language, code, stdin),
  });

  const completeSessionMutation = useMutation({
    mutationFn: completeInterviewSession,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["interview-sessions"] }),
  });

  const current = currentIndex < questions.length ? questions[currentIndex] : undefined;
  const finished = questions.length > 0 && currentIndex >= questions.length;

  // On mobile only one panel is visible at a time — jump to the editor
  // automatically for a coding question so it isn't missed behind a tab.
  useEffect(() => {
    if (current?.category === "coding") setMobileTab("code");
  }, [current]);

  // A session is persisted exactly once, the moment it's actually reached
  // the end — never on every answer, and never twice for the same session
  // (the ref resets only when a fresh question set replaces this one).
  const persistedRef = useRef(false);
  useEffect(() => {
    persistedRef.current = false;
  }, [questions]);
  useEffect(() => {
    if (!finished || persistedRef.current || !sessionStartedAt) return;
    persistedRef.current = true;
    completeSessionMutation.mutate({
      targetRole: targetRole.trim() || undefined,
      interviewType,
      difficulty: difficulty || undefined,
      totalQuestions: questions.length,
      answerScores: Object.values(feedbackByIndex).map((f) => f.overallScore),
      startedAt: new Date(sessionStartedAt).toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per finished session, not on every dep change
  }, [finished]);

  function handleAskCoach(message: string) {
    const prompt = message.trim();
    if (!prompt || coachMutation.isPending) return;
    const history = coachHistory;
    setCoachHistory((prev) => [...prev, { role: "user", content: prompt }]);
    coachMutation.mutate({ message: prompt, history });
  }

  function handleQuickStart(role: string, type: InterviewType) {
    setTargetRole(role);
    setInterviewType(type);
    questionsMutation.mutate({ role, type });
  }

  function handlePracticeWeakAreas(type: InterviewType) {
    setInterviewType(type);
    questionsMutation.mutate({ type });
  }

  function handleSubmitAnswer(answer: string) {
    if (!current || !answer.trim()) return;
    answerFeedbackMutation.mutate({ question: current.question, category: current.category, answer: answer.trim() });
  }

  return (
    <div className="mx-auto max-w-content space-y-5">
      <InterviewHeader />

      <InterviewConfigBar
        targetRole={targetRole}
        onTargetRoleChange={setTargetRole}
        resumes={resumes}
        resumeId={selectedResumeId ?? ""}
        onResumeIdChange={setResumeId}
        interviewType={interviewType}
        onInterviewTypeChange={setInterviewType}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onGenerate={() => questionsMutation.mutate({})}
        generating={questionsMutation.isPending}
      />
      {questionsMutation.isError && (
        <p className="text-sm text-critical">{mutationErrorMessage(questionsMutation.error, "Couldn't generate questions — try again in a moment.")}</p>
      )}

      <Tabs items={MOBILE_TABS} value={mobileTab} onChange={(v) => setMobileTab(v as MobileTab)} ariaLabel="Interview prep view" className="lg:hidden" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr_1fr]">
        <div className={cn(mobileTab === "progress" ? "block" : "hidden", "lg:block")}>
          <InterviewSidebar
            targetRole={targetRole}
            resumeLabel={selectedResume ? (selectedResume.targetRole ?? selectedResume.fileName) : null}
            questions={questions}
            currentIndex={currentIndex}
            feedbackByIndex={feedbackByIndex}
            difficulty={difficulty}
            sessionStartedAt={sessionStartedAt}
            sessions={sessionsPage?.items}
          />
        </div>

        <div className={cn(mobileTab === "interview" ? "block" : "hidden", "lg:block")}>
          <InterviewCoach
            firstName={firstName}
            hasResume={Boolean(selectedResumeId)}
            questions={questions}
            currentIndex={currentIndex}
            feedbackByIndex={feedbackByIndex}
            difficulty={difficulty}
            answerDraft={answerDraft}
            onAnswerDraftChange={setAnswerDraft}
            onSubmitAnswer={() => handleSubmitAnswer(answerDraft)}
            submittingAnswer={answerFeedbackMutation.isPending}
            answerErrorMessage={
              answerFeedbackMutation.isError
                ? mutationErrorMessage(answerFeedbackMutation.error, "Couldn't score that answer — try again in a moment.")
                : null
            }
            onNext={nextQuestion}
            onSkip={nextQuestion}
            onHint={() =>
              current && handleAskCoach(`Give me a hint for this interview question without revealing the full answer: "${current.question}"`)
            }
            onConcept={() =>
              current && handleAskCoach(`Briefly explain the underlying concept behind this interview question: "${current.question}"`)
            }
            hintPending={coachMutation.isPending}
            onQuickStart={handleQuickStart}
            onPracticeWeakAreas={handlePracticeWeakAreas}
            onNewInterview={() => questionsMutation.mutate({})}
            coachHistory={coachHistory}
            coachMessage={coachMessage}
            onCoachMessageChange={setCoachMessage}
            onAskCoach={() => handleAskCoach(coachMessage)}
            coachPending={coachMutation.isPending}
            coachErrorMessage={coachMutation.isError ? mutationErrorMessage(coachMutation.error, "Couldn't reach the coach — try again.") : null}
            onNewChat={() => setCoachHistory([])}
          />
        </div>

        <div className={cn(mobileTab === "code" ? "block" : "hidden", "lg:block")}>
          <CodingWorkspace
            language={language}
            onLanguageChange={(l) => {
              setLanguage(l);
              setCode(STARTER_CODE[l]);
            }}
            code={code}
            onCodeChange={setCode}
            stdin={stdin}
            onStdinChange={setStdin}
            onRun={() => runMutation.mutate()}
            runPending={runMutation.isPending}
            runResult={runMutation.data}
            runError={runMutation.isError}
            isCodingQuestion={current?.category === "coding"}
            onSendAsAnswer={() => handleSubmitAnswer(code)}
            sendingAsAnswer={answerFeedbackMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
