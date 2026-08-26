import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Map,
  Trash2,
  BookOpen,
  PlayCircle,
  Play,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileUp,
  Sparkles,
  Target,
  Layers3,
  ArrowRight,
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
    <div className="mx-auto max-w-content space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200/80 pb-5 dark:border-ink-700">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_8px_20px_-8px_rgba(67,83,255,.8)]"><Map className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">Growth workspace</p><h1 className="text-title font-semibold text-ink-900 dark:text-white">Learning roadmap</h1></div></div>
        {data && data.items.length > 0 && <div className="flex items-center gap-2 rounded-pill bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"><Layers3 className="h-3.5 w-3.5" /> {data.items.length} saved {data.items.length === 1 ? "roadmap" : "roadmaps"}</div>}
      </div>

      <Card className="rounded-panel border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/60 transition duration-200 hover:shadow-lift dark:border-ink-700 dark:from-ink-800 dark:via-ink-800 dark:to-brand-500/10">
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"><Sparkles className="h-4 w-4" /></span><p className="text-sm font-semibold text-ink-900 dark:text-white">Build your next learning path</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="e.g. DevOps, Python, Kubernetes, React, System Design…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => generateMutation.mutate()} disabled={!goal.trim() || generateMutation.isPending}>
              <Target className="h-4 w-4" />
              {generateMutation.isPending ? "Building…" : "Build roadmap"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-ink-50 px-3 py-2.5 dark:border-ink-700 dark:bg-ink-800/60">
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-400">Show resources:</span>
          <div className="flex gap-1.5">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResourceView(opt.value)}
                className={cn(
                  "rounded-pill border px-3 py-1 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5",
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
  const firstStageId = `${roadmap.id}-stage-0`;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-panel transition duration-200 hover:shadow-lift">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"><Target className="h-4 w-4" /></div><div>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">{roadmap.goal}</p>
            <p className="text-xs text-ink-400">{new Date(roadmap.createdAt).toLocaleString()}</p>
          </div></div>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        {roadmap.detectedSkills.length > 0 && (
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Skills detected in your resume</p>
              <div className="flex flex-wrap gap-1.5">
                {roadmap.detectedSkills.map((s) => (
                  <Badge key={s} tone="info">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            {roadmap.stages.length > 0 && (
              <a
                href={`#${firstStageId}`}
                className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600 transition hover:gap-1.5 hover:underline dark:text-brand-400"
              >
                Jump to first module <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </CardBody>
        )}
      </Card>

      {roadmap.stages.map((stage, i) => (
        <StageBlock key={i} id={i === 0 ? firstStageId : `${roadmap.id}-stage-${i}`} index={i} stage={stage} resourceView={resourceView} />
      ))}
    </div>
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

function StageBlock({
  id,
  index,
  stage,
  resourceView,
}: {
  id: string;
  index: number;
  stage: RoadmapStage;
  resourceView: ResourceView;
}) {
  const docs = useMemo(() => stage.resources.filter((r) => r.type !== "video"), [stage.resources]);
  const videos = useMemo(() => stage.resources.filter((r) => r.type === "video"), [stage.resources]);
  const showDocs = resourceView !== "youtube";
  const showVideos = resourceView !== "documentation";

  return (
    <Card id={id} className="scroll-mt-24 overflow-hidden rounded-panel transition duration-200 hover:shadow-lift">
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-xs font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{stage.title}</p>
                {stage.difficulty && <Badge tone={DIFFICULTY_TONE[stage.difficulty] ?? "neutral"}>{stage.difficulty}</Badge>}
              </div>
              {stage.prerequisites.length > 0 && (
                <p className="mt-1 text-xs text-ink-400">
                  Prerequisites: <span className="text-ink-600 dark:text-ink-300">{stage.prerequisites.join(", ")}</span>
                </p>
              )}
            </div>
          </div>
          {stage.skillStatus && <SkillStatusTag status={stage.skillStatus} />}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          {stage.topics.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">What you'll cover</p>
              <ul className="space-y-1.5">
                {stage.topics.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-200">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showDocs && docs.length > 0 && (
            <div className="w-full rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-800/60 md:w-56">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
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
                        className="group/link inline-flex items-center gap-1 rounded-lg text-brand-600 transition hover:underline dark:text-brand-300"
                      >
                        {r.title} <ExternalLink className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
                      </a>
                    ) : (
                      <span className="text-ink-500 dark:text-ink-400">{r.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {showVideos && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
              <PlayCircle className="h-3.5 w-3.5" /> Recommended videos
            </p>
            {videos.length > 0 ? (
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {videos.map((v, j) => (
                  <div
                    key={j}
                    className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-1.5rem)/3)]"
                  >
                    <VideoCard video={v} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-400">YouTube resources are temporarily unavailable.</p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function VideoCard({ video }: { video: RoadmapResource }) {
  const duration = formatDuration(video.durationSeconds);
  return (
    <a
      href={video.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-100 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift dark:border-ink-700 dark:bg-ink-800 dark:hover:border-brand-500/40"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-ink-100 dark:bg-ink-700">
        {video.thumbnailUrl && (
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900/0 transition-colors duration-200 group-hover:bg-ink-900/10">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-600 opacity-90 shadow-md transition-all duration-200 group-hover:scale-110 group-hover:opacity-100 group-hover:bg-white">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </div>
        {duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {duration}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-ink-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
          {video.title}
        </p>
        {video.channelName && <p className="text-xs text-ink-400">{video.channelName}</p>}
      </div>
    </a>
  );
}
