import { motion } from "framer-motion";
import { Heart, MapPin } from "lucide-react";
import type { Job } from "@believe-ai/shared";
import { Chip } from "../../components/ui/Chip.js";
import { cn } from "../../lib/cn.js";
import { EASE, MOTION } from "../../lib/motion.js";
import { JobMatchIndicator } from "./JobMatchIndicator.js";
import { formatSalary, isFresh, timeAgo, WORK_MODE_LABELS, EMPLOYMENT_LABELS } from "./jobDisplay.js";

export function CompanyMark({ company }: { company: string }) {
  const initial = company.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent-soft text-sm font-semibold text-accent">
      {initial}
    </div>
  );
}

export function JobCard({
  job,
  selected,
  resumeId,
  onSelect,
  onToggleSave,
  saving,
}: {
  job: Job;
  selected: boolean;
  resumeId: string | undefined;
  onSelect: () => void;
  onToggleSave: () => void;
  saving: boolean;
}) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const visibleSkills = job.skills.slice(0, 4);
  const extraSkillCount = job.skills.length - visibleSkills.length;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      whileHover={{ y: -1 }}
      transition={{ duration: MOTION.fast, ease: EASE }}
      className={cn(
        "group cursor-pointer rounded-card border p-4 transition-colors",
        selected
          ? "border-accent bg-accent-soft/40 shadow-card"
          : "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyMark company={job.company} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-fg">{job.title}</h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
              disabled={saving}
              title={job.isSaved ? "Unsave" : "Save"}
              className={cn("shrink-0 transition-colors", job.isSaved ? "text-critical" : "text-fg-subtle hover:text-critical")}
            >
              <Heart className={cn("h-4 w-4", job.isSaved && "fill-current")} />
            </button>
          </div>
          <p className="truncate text-caption text-fg-muted">{job.company}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-fg-subtle">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {job.location}
                {job.workMode && ` · ${WORK_MODE_LABELS[job.workMode]}`}
              </span>
            )}
            {job.employmentType && <span>{EMPLOYMENT_LABELS[job.employmentType]}</span>}
            {salary && <span className="font-medium text-fg-muted">{salary}</span>}
          </div>

          {visibleSkills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {visibleSkills.map((s) => (
                <Chip key={s} className="pointer-events-none px-2 py-0.5">
                  {s}
                </Chip>
              ))}
              {extraSkillCount > 0 && <Chip className="pointer-events-none px-2 py-0.5">+{extraSkillCount}</Chip>}
            </div>
          )}

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <JobMatchIndicator job={job} resumeId={resumeId} compact />
            <span className="flex shrink-0 items-center gap-1.5 text-caption text-fg-subtle">
              {isFresh(job.createdAt) && <span className="rounded-pill bg-positive/15 px-1.5 py-0.5 text-[10px] font-semibold text-positive">NEW</span>}
              {timeAgo(job.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
