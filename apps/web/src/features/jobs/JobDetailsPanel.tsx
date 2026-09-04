import { useNavigate } from "react-router-dom";
import { ExternalLink, Heart, MapPin, X } from "lucide-react";
import type { Job } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Chip } from "../../components/ui/Chip.js";
import { cn } from "../../lib/cn.js";
import { CompanyMark } from "./JobCard.js";
import { EMPLOYMENT_LABELS, WORK_MODE_LABELS, formatSalary, timeAgo } from "./jobDisplay.js";
import { JobMatchIndicator } from "./JobMatchIndicator.js";
import { CareerActions } from "./CareerActions.js";
import { useJobMatch } from "./useJobMatch.js";

export function JobDetailsPanel({
  job,
  resumeId,
  onToggleSave,
  saving,
  onClose,
}: {
  job: Job;
  resumeId: string | undefined;
  onToggleSave: () => void;
  saving: boolean;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const { data: match } = useJobMatch(job, resumeId);
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <div className="space-y-5">
      {onClose && (
        <button type="button" onClick={onClose} className="flex items-center gap-1.5 text-caption font-medium text-fg-muted hover:text-fg">
          <X className="h-3.5 w-3.5" /> Close
        </button>
      )}

      <div className="flex items-start gap-3">
        <CompanyMark company={job.company} />
        <div className="min-w-0 flex-1">
          <h2 className="text-h3 text-fg">{job.title}</h2>
          <p className="text-label text-fg-muted">{job.company}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-fg-subtle">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {job.location}
            {job.workMode && ` · ${WORK_MODE_LABELS[job.workMode]}`}
          </span>
        )}
        {job.employmentType && <span>{EMPLOYMENT_LABELS[job.employmentType]}</span>}
        <span>Posted {timeAgo(job.createdAt)}</span>
      </div>
      {salary && <p className="text-sm font-semibold text-fg">{salary}</p>}

      <div className="flex items-center gap-2">
        {job.applyUrl && (
          <a href={job.applyUrl} target="_blank" rel="noreferrer" className="flex-1">
            <Button className="w-full">
              Apply on company site <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        )}
        <Button
          variant="secondary"
          onClick={onToggleSave}
          disabled={saving}
          className={cn(!job.applyUrl && "flex-1")}
        >
          <Heart className={cn("h-4 w-4", job.isSaved && "fill-current text-critical")} /> {job.isSaved ? "Saved" : "Save"}
        </Button>
      </div>
      {job.recruiterLinkedIn && (
        <a href={job.recruiterLinkedIn} target="_blank" rel="noreferrer">
          <Button variant="secondary" size="sm" className="w-full">
            Recruiter on LinkedIn <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      )}

      <div className="border-t border-line pt-4">
        <JobMatchIndicator
          job={job}
          resumeId={resumeId}
          onAnalyzeFit={() => navigate("/app/career-fit", { state: { targetRole: job.title, resumeId } })}
        />
      </div>

      <div className="space-y-2 border-t border-line pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">About the role</p>
        <p className="whitespace-pre-line text-sm text-fg">{job.description || "No description provided."}</p>
      </div>

      {job.skills.length > 0 && (
        <div className="space-y-2 border-t border-line pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <Chip key={s} className="pointer-events-none">
                {s}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-line pt-4">
        <CareerActions job={job} resumeId={resumeId} gapSkills={match?.gapSkills ?? []} />
      </div>
    </div>
  );
}
