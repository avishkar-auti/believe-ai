import { useState } from "react";
import { Layers3, MoreHorizontal, Sparkles, Target, Trash2 } from "lucide-react";
import type { Roadmap } from "@believe-ai/shared";
import { Menu } from "../../components/ui/Menu.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { DetectedSkills } from "./DetectedSkills.js";

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"] as const;
const DIFFICULTY_LABEL: Record<(typeof DIFFICULTY_ORDER)[number], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function difficultyRange(stages: Roadmap["stages"]): string | null {
  const present = new Set(stages.map((s) => s.difficulty).filter(Boolean));
  const ordered = DIFFICULTY_ORDER.filter((d) => present.has(d));
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  if (!first || !last) return null;
  if (first === last) return DIFFICULTY_LABEL[first];
  return `${DIFFICULTY_LABEL[first]} → ${DIFFICULTY_LABEL[last]}`;
}

export function RoadmapOverview({ roadmap, onDelete, deleting }: { roadmap: Roadmap; onDelete: () => void; deleting: boolean }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const range = difficultyRange(roadmap.stages);
  const coverage = { strong: 0, improve: 0, missing: 0 };
  for (const s of roadmap.stages) if (s.skillStatus) coverage[s.skillStatus] += 1;
  const coverageTotal = coverage.strong + coverage.improve + coverage.missing;

  return (
    <div className="rounded-panel border border-line bg-surface p-6 shadow-card ring-1 ring-inset ring-fg/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {roadmap.detectedSkills.length > 0 && (
            <p className="mb-1.5 flex items-center gap-1.5 text-caption font-medium text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Personalized learning path
            </p>
          )}
          <h2 className="flex items-center gap-2.5 text-h2 text-fg">
            <Target className="h-5 w-5 shrink-0 text-accent" /> {roadmap.goal}
          </h2>
          <p className="mt-1 text-caption text-fg-subtle">
            Built {new Date(roadmap.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <Menu
          align="end"
          trigger={
            <button
              type="button"
              aria-label="Roadmap options"
              className="shrink-0 rounded-control p-2 text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[{ id: "delete", label: "Delete roadmap", icon: Trash2, danger: true, onSelect: () => setConfirmOpen(true) }]}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-fg-muted">
        <span className="flex items-center gap-1.5">
          <Layers3 className="h-3.5 w-3.5" /> {roadmap.stages.length} module{roadmap.stages.length === 1 ? "" : "s"}
        </span>
        {range && <span>{range}</span>}
      </div>

      {coverageTotal > 0 && (
        <div className="mt-4">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            {coverage.strong > 0 && <div className="h-full bg-positive" style={{ width: `${(coverage.strong / coverageTotal) * 100}%` }} />}
            {coverage.improve > 0 && <div className="h-full bg-caution" style={{ width: `${(coverage.improve / coverageTotal) * 100}%` }} />}
            {coverage.missing > 0 && <div className="h-full bg-line-strong" style={{ width: `${(coverage.missing / coverageTotal) * 100}%` }} />}
          </div>
          <p className="mt-2 text-caption text-fg-subtle">
            Based on your resume — {coverage.strong > 0 && `${coverage.strong} already covered`}
            {coverage.strong > 0 && (coverage.improve > 0 || coverage.missing > 0) && " · "}
            {coverage.improve > 0 && `${coverage.improve} to strengthen`}
            {coverage.improve > 0 && coverage.missing > 0 && " · "}
            {coverage.missing > 0 && `${coverage.missing} to learn`}
          </p>
        </div>
      )}

      {roadmap.detectedSkills.length > 0 && (
        <div className="mt-5 border-t border-line pt-5">
          <DetectedSkills skills={roadmap.detectedSkills} />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${roadmap.goal}" roadmap?`}
        description="This action cannot be undone."
        confirmLabel="Delete roadmap"
        destructive
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
