import { Check, TrendingUp } from "lucide-react";
import type { SkillStatus } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";

const STATUS_LABEL: Record<NonNullable<SkillStatus>, string> = {
  strong: "Already covered by your resume",
  improve: "Partially covered by your resume",
  missing: "Not yet covered — to learn",
};

/** The circular marker on the timeline. Status comes straight from the stage's
 * real skillStatus — there's no persisted "current/completed" progress in the
 * data model, so this marks resume coverage, not course completion. */
export function RoadmapNode({ index, status }: { index: number; status: SkillStatus | null }) {
  const label = status ? STATUS_LABEL[status] : `Module ${index + 1}`;

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
        status === "strong" && "border-positive/30 bg-positive/15 text-positive",
        status === "improve" && "border-caution/30 bg-caution/15 text-caution",
        (status === "missing" || status === null) && "border-line bg-surface text-fg-muted",
      )}
    >
      {status === "strong" ? (
        <Check className="h-4 w-4" />
      ) : status === "improve" ? (
        <TrendingUp className="h-4 w-4" />
      ) : (
        String(index + 1).padStart(2, "0")
      )}
    </span>
  );
}
