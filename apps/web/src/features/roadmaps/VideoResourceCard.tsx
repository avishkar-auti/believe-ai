import { Play } from "lucide-react";
import type { RoadmapResource } from "@believe-ai/shared";

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function VideoResourceCard({ video }: { video: RoadmapResource }) {
  const duration = formatDuration(video.durationSeconds);

  return (
    <a
      href={video.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="group flex w-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-[transform,border-color] duration-150 hover:-translate-y-px hover:border-line-strong"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
        {video.thumbnailUrl && (
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-fg/0 transition-colors duration-150 group-hover:bg-fg/10">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-accent shadow-md">
            <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
          </span>
        </div>
        {duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {duration}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <p className="line-clamp-2 text-sm font-medium text-fg transition-colors group-hover:text-accent">{video.title}</p>
        {video.channelName && <p className="text-caption text-fg-subtle">{video.channelName}</p>}
      </div>
    </a>
  );
}
