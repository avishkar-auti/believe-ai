import type { RoadmapStage } from "@believe-ai/shared";
import { Select } from "../../components/ui/Select.js";

export function JumpToModule({ stages, roadmapId }: { stages: RoadmapStage[]; roadmapId: string }) {
  if (stages.length < 2) return null;

  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 text-caption font-medium text-fg-subtle">Jump to</span>

      <div className="hidden min-w-0 flex-wrap items-center gap-1.5 sm:flex">
        {stages.map((stage, i) => (
          <a
            key={i}
            href={`#${roadmapId}-stage-${i}`}
            className="shrink-0 rounded-pill border border-line px-2.5 py-1 text-xs font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            {String(i + 1).padStart(2, "0")} {stage.title}
          </a>
        ))}
      </div>

      <Select
        aria-label="Jump to module"
        className="!h-8 max-w-[14rem] text-xs sm:hidden"
        value=""
        onChange={(e) => {
          if (e.target.value) window.location.hash = e.target.value;
        }}
      >
        <option value="">Select a module…</option>
        {stages.map((stage, i) => (
          <option key={i} value={`${roadmapId}-stage-${i}`}>
            {String(i + 1).padStart(2, "0")} {stage.title}
          </option>
        ))}
      </Select>
    </div>
  );
}
