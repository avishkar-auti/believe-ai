import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import type { Job, JobMatch } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { useJobMatch } from "./useJobMatch.js";

const LABEL_TEXT: Record<JobMatch["label"], string> = {
  strong: "Strong match",
  good: "Good match",
  partial: "Partial match",
};

const LABEL_CLASSES: Record<JobMatch["label"], string> = {
  strong: "text-positive",
  good: "text-accent",
  partial: "text-caution",
};

/** Renders the real match computed by services/job_match_service.py (a job's
 * listed skills checked against the resume text) — never an invented number.
 * `compact` is the job-card badge; the full variant (details panel) adds the
 * expandable matched/gap skill lists. */
export function JobMatchIndicator({
  job,
  resumeId,
  compact = false,
  onAnalyzeFit,
}: {
  job: Job;
  resumeId: string | undefined;
  compact?: boolean;
  onAnalyzeFit?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: match, isLoading } = useJobMatch(job, resumeId);

  if (!resumeId) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
        <Sparkles className="h-3.5 w-3.5" /> Select a resume to see your fit
      </span>
    );
  }

  if (isLoading) {
    return <span className="text-xs text-fg-subtle">Checking fit…</span>;
  }

  // No listed skills to compare against — an honest "nothing to score" state,
  // not a fabricated 0%. Route to a full Career Fit analysis instead.
  if (!match) {
    return (
      <button
        type="button"
        onClick={onAnalyzeFit}
        className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
      >
        <Sparkles className="h-3.5 w-3.5" /> Analyze fit →
      </button>
    );
  }

  if (compact) {
    return (
      <span className={cn("flex items-center gap-1.5 text-xs font-semibold", LABEL_CLASSES[match.label])}>
        <Sparkles className="h-3.5 w-3.5" /> {match.matchPercent}% {LABEL_TEXT[match.label]}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn("flex w-full items-center justify-between gap-2 text-sm font-semibold", LABEL_CLASSES[match.label])}
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" /> {match.matchPercent}% {LABEL_TEXT[match.label]}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-150", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="space-y-2.5 rounded-control bg-surface-2 p-3">
          {match.matchedSkills.length > 0 && (
            <div className="space-y-1">
              {match.matchedSkills.map((s) => (
                <p key={s} className="flex items-center gap-1.5 text-xs text-fg">
                  <span className="text-positive">✓</span> {s}
                </p>
              ))}
            </div>
          )}
          {match.gapSkills.length > 0 && (
            <div className="space-y-1 border-t border-line pt-2">
              <p className="text-caption font-medium text-fg-muted">Potential gaps</p>
              {match.gapSkills.map((s) => (
                <p key={s} className="flex items-center gap-1.5 text-xs text-fg-muted">
                  <span className="text-caution">△</span> {s}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
