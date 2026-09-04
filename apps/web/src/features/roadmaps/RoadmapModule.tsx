import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, PlayCircle } from "lucide-react";
import type { ResourceView, RoadmapStage } from "@believe-ai/shared";
import { Badge } from "../../components/ui/Badge.js";
import { cn } from "../../lib/cn.js";
import { DocumentationResource } from "./DocumentationResource.js";
import { VideoResourceCard } from "./VideoResourceCard.js";

const DIFFICULTY_TONE: Record<string, "info" | "neutral" | "warning"> = {
  beginner: "info",
  intermediate: "neutral",
  advanced: "warning",
};

const COVERAGE_NOTE: Record<string, string> = {
  strong: "Your resume already shows a solid grasp of this — feel free to skim.",
  improve: "Your resume touches on this, but it's worth reinforcing.",
};

export function RoadmapModule({
  id,
  stage,
  resourceView,
  expanded,
  onToggle,
}: {
  id: string;
  stage: RoadmapStage;
  resourceView: ResourceView;
  expanded: boolean;
  onToggle: () => void;
}) {
  const docs = useMemo(() => stage.resources.filter((r) => r.type !== "video"), [stage.resources]);
  const videos = useMemo(() => stage.resources.filter((r) => r.type === "video"), [stage.resources]);
  const showDocs = resourceView !== "youtube";
  const showVideos = resourceView !== "documentation";
  const previewTopics = stage.topics.slice(0, 3);
  const extraTopics = stage.topics.length - previewTopics.length;

  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-24 rounded-card border bg-surface p-5 shadow-card ring-1 ring-inset ring-fg/[0.03] transition-colors duration-150",
        expanded ? "border-line-strong" : "border-line hover:border-line-strong",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16.5px] font-semibold text-fg">{stage.title}</h3>
            {stage.difficulty && (
              <Badge tone={DIFFICULTY_TONE[stage.difficulty] ?? "neutral"} className="capitalize">
                {stage.difficulty}
              </Badge>
            )}
          </div>
          {stage.prerequisites.length > 0 && (
            <p className="mt-1 text-caption text-fg-subtle">Prerequisites: {stage.prerequisites.join(" · ")}</p>
          )}
        </div>
      </div>

      {stage.skillStatus && COVERAGE_NOTE[stage.skillStatus] && (
        <p
          className={cn(
            "mt-2.5 text-caption font-medium",
            stage.skillStatus === "strong" ? "text-positive" : "text-caution",
          )}
        >
          {COVERAGE_NOTE[stage.skillStatus]}
        </p>
      )}

      {previewTopics.length > 0 && (
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          {previewTopics.join(" · ")}
          {extraTopics > 0 && <span className="text-fg-subtle"> +{extraTopics} more</span>}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-caption text-fg-subtle">
          {stage.topics.length} topic{stage.topics.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft"
        >
          {expanded ? "Collapse module" : "Explore module"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-5 border-t border-line pt-5">
              {stage.topics.length > 0 && (
                <div>
                  <p className="mb-2 text-caption font-semibold text-fg-subtle">Topics</p>
                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {stage.topics.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-sm text-fg">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showDocs && docs.length > 0 && (
                <div>
                  <p className="mb-2 text-caption font-semibold text-fg-subtle">Documentation</p>
                  <div className="space-y-2">
                    {docs.map((r, j) => (
                      <DocumentationResource key={j} resource={r} />
                    ))}
                  </div>
                </div>
              )}

              {showVideos && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-caption font-semibold text-fg-subtle">
                    <PlayCircle className="h-3.5 w-3.5" /> Recommended videos
                  </p>
                  {videos.length > 0 ? (
                    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {videos.map((v, j) => (
                        <div key={j} className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-1.5rem)/3)]">
                          <VideoResourceCard video={v} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-caption text-fg-subtle">Video resources are temporarily unavailable.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
