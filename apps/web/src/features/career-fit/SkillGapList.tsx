import { TriangleAlert } from "lucide-react";

export function SkillGapList({ skillGaps }: { skillGaps: string[] }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-section uppercase text-fg-subtle">
        <TriangleAlert className="h-3.5 w-3.5 text-caution" /> Areas to improve
      </p>
      <ul className="mt-2.5 space-y-2">
        {skillGaps.map((s) => (
          <li key={s} className="flex items-start gap-2.5 rounded-card bg-caution/[0.08] px-3.5 py-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-caution" />
            <span className="text-sm leading-relaxed text-fg">{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
