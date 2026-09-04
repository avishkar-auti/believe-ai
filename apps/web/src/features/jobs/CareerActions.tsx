import { useNavigate } from "react-router-dom";
import { FileSearch, GraduationCap, Map, MessageCircle, Target, type LucideIcon } from "lucide-react";
import type { Job } from "@believe-ai/shared";

/** Deep-links into the app's existing career tools, pre-filled with this
 * job's real context via router navigation state — each target page reads
 * `location.state` on mount and seeds its own existing form fields. Nothing
 * here re-implements Career Fit / Interview Prep / Roadmap / Job
 * Intelligence; it only hands them a head start. */
export function CareerActions({ job, resumeId, gapSkills }: { job: Job; resumeId: string | undefined; gapSkills: string[] }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Prepare for this role</p>

      <ActionRow icon={MessageCircle} label="Ask My Resume" description="Analyze how my resume fits this role" onClick={() => navigate("/app/resume")} />
      <ActionRow
        icon={Target}
        label="Career Fit"
        description="See strengths and gaps"
        onClick={() => navigate("/app/career-fit", { state: { targetRole: job.title, resumeId } })}
      />
      <ActionRow
        icon={GraduationCap}
        label="Interview Prep"
        description="Practice questions for this role"
        onClick={() =>
          navigate("/app/interview-prep", {
            state: {
              targetRole: `${job.title} at ${job.company}`,
              jobTitle: job.title,
              jobCompany: job.company,
              jobDescription: job.description,
              resumeId,
            },
          })
        }
      />
      {gapSkills.length > 0 && (
        <ActionRow
          icon={Map}
          label="Learning Roadmap"
          description={`Learn: ${gapSkills.slice(0, 3).join(", ")}${gapSkills.length > 3 ? "…" : ""}`}
          onClick={() => navigate("/app/roadmaps", { state: { goal: `Learn: ${gapSkills.join(", ")}`, resumeId } })}
        />
      )}
      {job.applyUrl && (
        <ActionRow
          icon={FileSearch}
          label="Job Intelligence"
          description="Research the company and hiring team"
          onClick={() => navigate("/app/job-outreach", { state: { jobUrl: job.applyUrl } })}
        />
      )}
    </div>
  );
}

function ActionRow({ icon: Icon, label, description, onClick }: { icon: LucideIcon; label: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-control border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span className="block truncate text-caption text-fg-subtle">{description}</span>
      </span>
    </button>
  );
}
