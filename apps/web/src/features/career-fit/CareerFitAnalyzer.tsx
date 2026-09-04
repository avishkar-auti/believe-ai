import { Link } from "react-router-dom";
import type { Resume } from "@believe-ai/shared";
import { Sparkles, Target } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { ResumeSelector } from "./ResumeSelector.js";

export function CareerFitAnalyzer({
  targetRole,
  onTargetRoleChange,
  resumes,
  selectedResumeId,
  onSelectResume,
  onAnalyze,
  analyzing,
  error,
}: {
  targetRole: string;
  onTargetRoleChange: (value: string) => void;
  resumes: Resume[] | undefined;
  selectedResumeId: string | undefined;
  onSelectResume: (id: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  error: boolean;
}) {
  const hasResume = Boolean(selectedResumeId);

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Target className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input
              placeholder="Enter a target role — e.g. Senior Backend Engineer"
              value={targetRole}
              onChange={(e) => onTargetRoleChange(e.target.value)}
              className="h-12 w-full rounded-control border border-line bg-surface pl-11 pr-4 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
            />
          </div>
          <Button onClick={onAnalyze} disabled={analyzing || !hasResume} className="sm:w-44">
            {analyzing ? (
              <>
                <Spinner className="h-4 w-4" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Analyze fit
              </>
            )}
          </Button>
        </div>

        {resumes && resumes.length > 0 ? (
          <div className="sm:max-w-xs">
            <ResumeSelector resumes={resumes} selectedResumeId={selectedResumeId} onSelect={onSelectResume} />
          </div>
        ) : (
          <p className="text-sm text-fg-muted">
            You'll need a resume first —{" "}
            <Link to="/app/resume" className="font-medium text-accent hover:underline">
              upload one
            </Link>
            .
          </p>
        )}

        {error && <p className="text-sm text-critical">Couldn't generate an assessment — try again in a moment.</p>}
      </CardBody>
    </Card>
  );
}
