import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import type { Resume } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { ResumeSelector } from "../career-fit/ResumeSelector.js";

/** No fabricated "top skills" or match-count summary here — those aren't
 * backed by any real endpoint. This strip only does what's actually true:
 * lets the user pick which resume job cards are matched against, or points
 * them to upload one first. */
export function ResumeMatchBanner({
  resumes,
  resumeId,
  onSelectResume,
}: {
  resumes: Resume[] | undefined;
  resumeId: string | undefined;
  onSelectResume: (id: string) => void;
}) {
  if (!resumes) return null;

  if (resumes.length === 0) {
    return (
      <div className="flex flex-col items-start justify-between gap-3 rounded-card border border-dashed border-line bg-surface-2 px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm text-fg-muted">Select your resume and Believe.ai can help surface more relevant opportunities.</p>
        </div>
        <Link to="/app/resume" className="shrink-0">
          <Button variant="secondary" size="sm">
            Select resume
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <Sparkles className="h-4 w-4 shrink-0 text-accent" />
        <p className="text-sm text-fg">
          <span className="font-semibold">Based on your resume.</span> Job cards below show your real match against each listing.
        </p>
      </div>
      <div className="w-full sm:w-64">
        <ResumeSelector resumes={resumes} selectedResumeId={resumeId} onSelect={onSelectResume} />
      </div>
    </div>
  );
}
