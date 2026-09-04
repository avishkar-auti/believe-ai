import { SiriOrb } from "../../components/ui/SiriOrb.js";
import { cn } from "../../lib/cn.js";
import type { InterviewType } from "./interviewApi.js";

const QUICK_ACTIONS: { label: string; role: string; type: InterviewType }[] = [
  { label: "Practice Java", role: "Java Backend Engineer", type: "technical" },
  { label: "Practice System Design", role: "", type: "system_design" },
  { label: "Practice DevOps", role: "DevOps Engineer", type: "technical" },
  { label: "Behavioral Interview", role: "", type: "behavioral" },
];

export function EmptyInterviewState({
  firstName,
  hasResume,
  onQuickStart,
}: {
  firstName: string | undefined;
  hasResume: boolean;
  onQuickStart: (role: string, type: InterviewType) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
      <SiriOrb size={72} />
      <div>
        <p className="bg-gradient-to-b from-fg to-fg-muted bg-clip-text text-h2 text-transparent">Ready when you are.</p>
        <p className="mt-1.5 max-w-sm text-label text-fg-muted">
          {firstName ? `${firstName}, choose` : "Choose"} a role above and I'll build an interview around your resume,
          experience, and target position.
        </p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={!hasResume}
            onClick={() => onQuickStart(action.role, action.type)}
            className={cn(
              "rounded-control border border-line bg-surface-2 px-3 py-2.5 text-left text-label font-medium text-fg transition-colors",
              hasResume ? "hover:border-line-strong hover:bg-surface-3" : "cursor-not-allowed opacity-50",
            )}
          >
            {action.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!hasResume}
        onClick={() => onQuickStart("", "mixed")}
        className={cn(
          "text-label font-medium text-accent transition-colors",
          hasResume ? "hover:text-accent-hover" : "cursor-not-allowed opacity-50",
        )}
      >
        Start quick practice →
      </button>
    </div>
  );
}
