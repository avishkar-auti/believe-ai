import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Map,
  Trash2,
  BookOpen,
  PlayCircle,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Roadmap, RoadmapResource, RoadmapStage, ResourceView } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { cn } from "../../lib/cn.js";
import { deleteRoadmap, fetchRoadmaps, generateRoadmap } from "./roadmapApi.js";
import { fetchResume } from "../resumes/resumeApi.js";

const VIEW_OPTIONS: { value: ResourceView; label: string }[] = [
  { value: "documentation", label: "Documentation" },
  { value: "youtube", label: "YouTube" },
  { value: "both", label: "Both" },
];

const DIFFICULTY_TONE: Record<string, "neutral" | "info" | "warning"> = {
  beginner: "info",
  intermediate: "neutral",
  advanced: "warning",
};

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function RoadmapPage() {
  const queryClient = useQueryClient();
  const [goal, setGoal] = useState("");
  const [personalize, setPersonalize] = useState(true);
  const [resourceView, setResourceView] = useState<ResourceView>("both");

  const { data, isLoading } = useQuery({ queryKey: ["roadmaps"], queryFn: fetchRoadmaps });
  const { data: resume } = useQuery({ queryKey: ["resume"], queryFn: fetchResume });

  const generateMutation = useMutation({
    mutationFn: () => generateRoadmap(goal, personalize),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
      setGoal("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoadmap,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
          <Map className="h-5 w-5 text-brand-500" /> Learning Roadmap
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Search a technology or goal — DevOps, Docker, React, System Design — and get a staged plan with real
          documentation and YouTube resources.
        </p>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="e.g. DevOps, Python, Kubernetes, React, System Design…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => generateMutation.mutate()} disabled={!goal.trim() || generateMutation.isPending}>
              {generateMutation.isPending ? "Building…" : "Build roadmap"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2 dark:bg-ink-800/60">
            <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
              <input
                type="checkbox"
                checked={personalize}
                disabled={!resume}
                onChange={(e) => setPersonalize(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-500 disabled:cursor-not-allowed"
              />
              Personalize using resume
            </label>
            {resume ? (
              <span className="text-xs text-ink-400">{resume.fileName}</span>
            ) : (
              <Link
                to="/app/resume"
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                <FileUp className="h-3.5 w-3.5" /> Upload a resume to personalize
              </Link>
            )}
          </div>
        </CardBody>
        {generateMutation.isError && (
          <CardBody className="pt-0">
            <p className="text-sm text-red-600">Couldn't build a roadmap — try again in a moment.</p>
          </CardBody>
        )}
      </Card>

      {data && data.items.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-400">Learning resources:</span>
          <div className="flex gap-1.5">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResourceView(opt.value)}
                className={cn(
                  "rounded-pill border px-3 py-1 text-xs font-medium transition-colors",
                  resourceView === opt.value
                    ? "border-ink-900 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-ink-900"
                    : "border-ink-200 text-ink-500 hover:text-ink-800 dark:border-ink-700 dark:text-ink-400",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-ink-400" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No roadmaps yet" description="Search a topic above to build your first learning roadmap." />
      ) : (
        <div className="space-y-4">
          {data.items.map((roadmap) => (
            <RoadmapCard
              key={roadmap.id}
              roadmap={roadmap}
              resourceView={resourceView}
              onDelete={() => deleteMutation.mutate(roadmap.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoadmapCard({
  roadmap,
  resourceView,
  onDelete,
}: {
  roadmap: Roadmap;
  resourceView: ResourceView;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink-900 dark:text-white">{roadmap.goal}</p>
          <p className="text-xs text-ink-400">{new Date(roadmap.createdAt).toLocaleString()}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardBody className="space-y-6">
        {roadmap.detectedSkills.length > 0 && (
          <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">Detected skills</p>
            <div className="flex flex-wrap gap-1.5">
              {roadmap.detectedSkills.map((s) => (
                <Badge key={s} tone="info">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {roadmap.stages.map((stage, i) => (
          <StageBlock key={i} index={i} stage={stage} resourceView={resourceView} />
        ))}
      </CardBody>
    </Card>
  );
}

function SkillStatusTag({ status }: { status: RoadmapStage["skillStatus"] }) {
  if (status === "strong") {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-lime-600 dark:text-lime-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Your resume already shows this
      </span>
    );
  }
  if (status === "improve") {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        <TrendingUp className="h-3.5 w-3.5" /> Mentioned, but could be stronger
      </span>
    );
  }
  if (status === "missing") {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
        <AlertTriangle className="h-3.5 w-3.5" /> Not detected in your resume
      </span>
    );
  }
  return null;
}

function StageBlock({ index, stage, resourceView }: { index: number; stage: RoadmapStage; resourceView: ResourceView }) {
  const docs = useMemo(() => stage.resources.filter((r) => r.type !== "video"), [stage.resources]);
  const videos = useMemo(() => stage.resources.filter((r) => r.type === "video"), [stage.resources]);
  const showDocs = resourceView !== "youtube";
  const showVideos = resourceView !== "documentation";

  return (
    <div className="border-l-2 border-brand-500/30 pl-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-ink-900 dark:text-white">
          {index + 1}. {stage.title}
        </p>
        {stage.difficulty && <Badge tone={DIFFICULTY_TONE[stage.difficulty] ?? "neutral"}>{stage.difficulty}</Badge>}
      </div>

      {stage.skillStatus && (
        <div className="mt-1">
          <SkillStatusTag status={stage.skillStatus} />
        </div>
      )}

      {stage.prerequisites.length > 0 && (
        <p className="mt-1.5 text-xs text-ink-400">
          Prerequisites: <span className="text-ink-600 dark:text-ink-300">{stage.prerequisites.join(", ")}</span>
        </p>
      )}

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {stage.topics.map((t) => (
          <Badge key={t} tone="neutral">
            {t}
          </Badge>
        ))}
      </div>

      {showDocs && docs.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
            <BookOpen className="h-3.5 w-3.5" /> Documentation
          </p>
          <ul className="space-y-1 text-sm">
            {docs.map((r, j) => (
              <li key={j}>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-300"
                  >
                    {r.title} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-ink-500 dark:text-ink-400">{r.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showVideos && (
        <div className="mt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
            <PlayCircle className="h-3.5 w-3.5" /> Recommended YouTube Videos
          </p>
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v, j) => (
                <VideoCard key={j} video={v} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-400">YouTube resources are temporarily unavailable.</p>
          )}
        </div>
      )}
    </div>
  );
}

function VideoCard({ video }: { video: RoadmapResource }) {
  const duration = formatDuration(video.durationSeconds);
  return (
    <a
      href={video.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-100 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lift dark:border-ink-700 dark:bg-ink-800"
    >
      <div className="relative aspect-video w-full bg-ink-100 dark:bg-ink-700">
        {video.thumbnailUrl && (
          <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        {duration && (
          <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {duration}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-ink-900 dark:text-white">{video.title}</p>
        {video.channelName && <p className="text-xs text-ink-400">{video.channelName}</p>}
        <span className="mt-auto flex items-center gap-1 pt-1 text-xs font-medium text-brand-600 group-hover:underline dark:text-brand-400">
          Watch on YouTube <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  );
}
