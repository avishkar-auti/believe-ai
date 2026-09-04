import { useState } from "react";
import { Check } from "lucide-react";
import { Tooltip } from "../../components/ui/Tooltip.js";

const INITIAL_COUNT = 8;

export function DetectedSkills({ skills }: { skills: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (skills.length === 0) return null;

  const visible = expanded ? skills : skills.slice(0, INITIAL_COUNT);
  const remaining = skills.length - visible.length;

  return (
    <div>
      <Tooltip label="Detected from your resume">
        <p className="w-fit text-caption font-medium text-fg-subtle">Already in your toolkit</p>
      </Tooltip>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {visible.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-pill border border-line bg-surface px-2.5 py-1 text-xs font-medium text-fg-muted"
          >
            <Check className="h-3 w-3 text-positive" /> {skill}
          </span>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-pill px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            +{remaining} more
          </button>
        )}
      </div>
    </div>
  );
}
