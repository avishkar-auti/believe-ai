import { Sparkles } from "lucide-react";

/** A real indicator, not decoration — only rendered when a resume is actually
 * selected and driving question generation + feedback (see InterviewConfigBar). */
export function ResumeContextBadge({ resumeLabel }: { resumeLabel: string }) {
  return (
    <span
      title="Questions and feedback reference skills and projects found in your resume."
      className="inline-flex items-center gap-1.5 rounded-pill bg-accent-soft px-2.5 py-1 text-caption font-medium text-accent"
    >
      <Sparkles className="h-3 w-3" />
      Resume context enabled
      <span className="max-w-[10rem] truncate text-accent/70">· {resumeLabel}</span>
    </span>
  );
}
