import { Link } from "react-router-dom";
import { ArrowRight, Circle, CircleCheck, CircleDot } from "lucide-react";
import type { ChallengeSummary } from "@believe-ai/shared";
import { Badge } from "../../components/ui/Badge.js";
import { cn } from "../../lib/cn.js";

const STATUS_META = {
  solved: { icon: CircleCheck, className: "text-positive", label: "Solved" },
  attempted: { icon: CircleDot, className: "text-accent", label: "Attempted" },
  unsolved: { icon: Circle, className: "text-fg-subtle", label: "Unsolved" },
} as const;

const DIFFICULTY_TONE = { beginner: "info", intermediate: "neutral", advanced: "warning" } as const;
const TYPE_LABEL: Record<string, string> = {
  coding: "Coding",
  debugging: "Debugging",
  "system-design": "System design",
  "prompt-engineering": "Prompt engineering",
};

export function ChallengeCard({ challenge }: { challenge: ChallengeSummary }) {
  const status = STATUS_META[challenge.status];

  return (
    <Link
      to={`/app/practice/challenges/${challenge.slug}`}
      className="group flex flex-col gap-2.5 rounded-card border border-line bg-surface p-5 shadow-card ring-1 ring-inset ring-fg/[0.03] transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-line-strong hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <status.icon className={cn("mt-0.5 h-4 w-4 shrink-0", status.className)} aria-label={status.label} />
          <h3 className="min-w-0 truncate text-[15px] font-semibold text-fg">{challenge.title}</h3>
        </div>
        <Badge tone={DIFFICULTY_TONE[challenge.difficulty]} className="shrink-0 capitalize">
          {challenge.difficulty}
        </Badge>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-fg-muted">{challenge.summary}</p>

      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {challenge.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-pill border border-line px-2 py-0.5 text-[11px] font-medium text-fg-subtle">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-1 flex items-center justify-between gap-3 border-t border-line pt-3 text-caption text-fg-subtle">
        <span>
          {TYPE_LABEL[challenge.challengeType] ?? challenge.challengeType}
          {challenge.estimatedMinutes ? ` · ~${challenge.estimatedMinutes} min` : ""}
        </span>
        <span className="flex items-center gap-1 font-semibold text-accent transition-transform duration-150 group-hover:translate-x-0.5">
          {challenge.status === "unsolved" ? "Start" : "Review"} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
