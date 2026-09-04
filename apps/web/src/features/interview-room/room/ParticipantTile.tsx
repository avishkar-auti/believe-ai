import { useEffect, useRef } from "react";
import { Crown, Mic, MicOff, Star, VideoOff } from "lucide-react";
import { avatarTint, initials } from "./roomFormat.js";
import { cn } from "../../../lib/cn.js";

/**
 * One participant on the stage. Renders the real MediaStream when there is one
 * and falls back to an initials avatar when video is off or the peer has no
 * camera — never a placeholder person.
 */
export function ParticipantTile({
  userId,
  name,
  stream,
  isLocal = false,
  isHost = false,
  isSpeaking = false,
  isCurrentSpeaker = false,
  micOn = true,
  cameraOn = true,
  averageRating,
  className,
}: {
  userId: string;
  name: string;
  stream: MediaStream | null;
  isLocal?: boolean;
  isHost?: boolean;
  isSpeaking?: boolean;
  isCurrentSpeaker?: boolean;
  micOn?: boolean;
  cameraOn?: boolean;
  averageRating?: number | null;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasVideo = Boolean(stream && stream.getVideoTracks().length > 0) && cameraOn;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream;
  }, [stream]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-fg/[0.05] ring-1 ring-inset transition-shadow duration-200",
        isSpeaking ? "ring-2 ring-positive" : "ring-line",
        isCurrentSpeaker && !isSpeaking && "ring-2 ring-accent",
        className,
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn("h-full w-full object-cover", hasVideo ? "opacity-100" : "opacity-0")}
      />

      {!hasVideo && (
        <div className="absolute inset-0 grid place-items-center">
          <div
            className={cn(
              "grid h-16 w-16 place-items-center rounded-pill text-h2 font-semibold",
              avatarTint(userId),
            )}
            aria-hidden
          >
            {initials(name)}
          </div>
        </div>
      )}

      {isCurrentSpeaker && (
        <div className="absolute left-3 top-3 rounded-pill bg-accent px-2.5 py-1 text-caption font-semibold text-accent-fg">
          Answering now
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/65 to-transparent px-3 pb-2.5 pt-8">
        <span className="truncate text-label font-medium text-white">
          {name}
          {isLocal && " (you)"}
        </span>
        {isHost && <Crown className="h-3 w-3 shrink-0 text-caution" aria-label="Host" />}
        {typeof averageRating === "number" && (
          <span className="flex shrink-0 items-center gap-0.5 text-caption text-white/80">
            <Star className="h-3 w-3 fill-current text-caution" aria-hidden />
            {averageRating.toFixed(1)}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          {micOn ? (
            <Mic className={cn("h-3.5 w-3.5", isSpeaking ? "text-positive" : "text-white/70")} aria-label="Mic on" />
          ) : (
            <MicOff className="h-3.5 w-3.5 text-critical" aria-label="Mic off" />
          )}
          {!hasVideo && <VideoOff className="h-3.5 w-3.5 text-white/60" aria-label="Camera off" />}
        </span>
      </div>
    </div>
  );
}
