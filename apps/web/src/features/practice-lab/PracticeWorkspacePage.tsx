import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "../../components/ui/Spinner.js";
import { ApiError } from "../../lib/apiClient.js";
import { evaluateChallenge, fetchChallengeBySlug, runChallenge, submitChallenge } from "./practiceApi.js";
import { usePracticeWorkspaceStore } from "./practiceWorkspaceStore.js";
import { WorkspaceHeader } from "./WorkspaceHeader.js";
import { WorkspaceToolbar } from "./WorkspaceToolbar.js";
import { ProblemPanel } from "./ProblemPanel.js";
import { FileExplorer } from "./FileExplorer.js";
import { CodeEditor } from "./CodeEditor.js";
import { ResultTabs } from "./ResultTabs.js";
import { SubmissionHistoryPanel } from "./SubmissionHistoryPanel.js";
import { ChallengeLibraryErrorState } from "./ChallengeLibraryErrorState.js";

/** ApiError.message is already a safe, user-facing string for a rate-limit
 * rejection specifically (see core/rate_limit.py) — worth showing verbatim
 * since it tells the student when to come back. Anything else (network
 * error, unexpected 500) falls back to a generic message rather than
 * risking a raw/technical one reaching the screen. */
function mutationErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === "PLAN_LIMIT_EXCEEDED") return error.message;
  return "Something went wrong — try again in a moment.";
}

export function PracticeWorkspacePage() {
  const { slug = "" } = useParams();
  const queryClient = useQueryClient();
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: challenge, isLoading, isError, refetch } = useQuery({
    queryKey: ["practice-challenge", slug],
    queryFn: () => fetchChallengeBySlug(slug),
  });

  const { activeFilePath, fileContents, lastResult, loadChallenge, setActiveFile, updateFileContent, setLastResult } =
    usePracticeWorkspaceStore();

  useEffect(() => {
    if (challenge) loadChallenge(challenge.slug, challenge.starterFiles);
  }, [challenge, loadChallenge]);

  const runMutation = useMutation({
    mutationFn: () => runChallenge(slug, fileContents),
    onSuccess: setLastResult,
  });
  const evaluateMutation = useMutation({
    mutationFn: () => evaluateChallenge(slug, fileContents),
    onSuccess: setLastResult,
  });
  const submitMutation = useMutation({
    mutationFn: () => submitChallenge(challenge?.id ?? "", fileContents),
    onSuccess: (submission) => {
      setLastResult(submission);
      // A submit can flip this challenge's real solved status — refresh
      // everywhere it's shown (this page's header badge, the library list,
      // the overview's progress tiles) rather than waiting for a reload.
      void queryClient.invalidateQueries({ queryKey: ["practice-challenge", slug] });
      void queryClient.invalidateQueries({ queryKey: ["practice-challenges"] });
      void queryClient.invalidateQueries({ queryKey: ["practice-progress"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6 text-fg-subtle" />
      </div>
    );
  }

  if (isError || !challenge) {
    return (
      <div className="mx-auto max-w-content">
        <ChallengeLibraryErrorState onRetry={() => void refetch()} />
      </div>
    );
  }

  const activeFile = challenge.starterFiles.find((f) => f.path === activeFilePath);
  const actionError = submitMutation.error ?? evaluateMutation.error ?? runMutation.error;

  return (
    <div className="mx-auto max-w-content space-y-5">
      <WorkspaceHeader challenge={challenge} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        <ProblemPanel challenge={challenge} />

        <div className="min-w-0">
          <FileExplorer files={challenge.starterFiles} activePath={activeFilePath} onSelect={setActiveFile} />
          {activeFile && (
            <CodeEditor
              path={activeFile.path}
              value={fileContents[activeFile.path] ?? activeFile.content}
              readOnly={activeFile.readOnly}
              onChange={(value) => updateFileContent(activeFile.path, value)}
            />
          )}
        </div>
      </div>

      <ResultTabs result={lastResult} />

      {actionError && <p className="text-sm text-critical">{mutationErrorMessage(actionError)}</p>}

      <WorkspaceToolbar
        lastResult={lastResult}
        onRun={() => runMutation.mutate()}
        onEvaluate={() => evaluateMutation.mutate()}
        onSubmit={() => submitMutation.mutate()}
        onShowHistory={() => setHistoryOpen(true)}
        running={runMutation.isPending}
        evaluating={evaluateMutation.isPending}
        submitting={submitMutation.isPending}
      />

      <SubmissionHistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} challengeId={challenge.id} />
    </div>
  );
}
