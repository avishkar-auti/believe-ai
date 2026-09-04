import { useState } from "react";
import type { ResourceView, RoadmapStage } from "@believe-ai/shared";
import { RoadmapNode } from "./RoadmapNode.js";
import { RoadmapModule } from "./RoadmapModule.js";

export function RoadmapTimeline({
  roadmapId,
  stages,
  resourceView,
}: {
  roadmapId: string;
  stages: RoadmapStage[];
  resourceView: ResourceView;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="relative">
      <div className="absolute bottom-5 left-5 top-5 w-px bg-line" aria-hidden="true" />
      <ol className="space-y-6">
        {stages.map((stage, i) => (
          <li key={i} className="flex gap-4">
            <RoadmapNode index={i} status={stage.skillStatus} />
            <div className="min-w-0 flex-1 pt-0.5">
              <RoadmapModule
                id={`${roadmapId}-stage-${i}`}
                stage={stage}
                resourceView={resourceView}
                expanded={expandedIndex === i}
                onToggle={() => setExpandedIndex((cur) => (cur === i ? null : i))}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
