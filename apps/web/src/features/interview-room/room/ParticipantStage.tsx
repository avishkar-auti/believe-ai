import { MonitorUp } from "lucide-react";
import { ParticipantTile } from "./ParticipantTile.js";
import { stageGridClass } from "./roomFormat.js";
import { cn } from "../../../lib/cn.js";

export interface StageParticipant {
  userId: string;
  name: string;
  stream: MediaStream | null;
  isLocal: boolean;
  isHost: boolean;
  micOn: boolean;
  cameraOn: boolean;
  averageRating?: number | null;
}

/**
 * The video stage. Two layouts: an even grid, or a focus layout when someone is
 * sharing their screen (or a speaker is pinned by the turn state) with the rest
 * of the room reduced to a filmstrip.
 */
export function ParticipantStage({
  participants,
  speakingIds,
  currentSpeakerUserId,
  screenStream,
  screenOwnerName,
  className,
}: {
  participants: StageParticipant[];
  speakingIds: Set<string>;
  currentSpeakerUserId: string | null;
  screenStream?: MediaStream | null;
  screenOwnerName?: string | null;
  className?: string;
}) {
  const focusId = screenStream ? null : currentSpeakerUserId;
  const focused = focusId ? participants.find((p) => p.userId === focusId) ?? null : null;
  const useFocusLayout = Boolean(screenStream) || (focused !== null && participants.length > 2);

  if (!useFocusLayout) {
    return (
      <div className={cn("grid min-h-0 flex-1 gap-3", stageGridClass(participants.length), className)}>
        {participants.map((p) => (
          <ParticipantTile
            key={p.userId}
            {...p}
            isSpeaking={speakingIds.has(p.userId)}
            isCurrentSpeaker={p.userId === currentSpeakerUserId}
          />
        ))}
      </div>
    );
  }

  const filmstrip = participants.filter((p) => p.userId !== focused?.userId);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl ring-1 ring-inset ring-line">
        {screenStream ? (
          <>
            <ScreenSurface stream={screenStream} />
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-pill bg-black/60 px-2.5 py-1 text-caption font-medium text-white">
              <MonitorUp className="h-3 w-3" aria-hidden />
              {screenOwnerName ? `${screenOwnerName} is presenting` : "Screen share"}
            </div>
          </>
        ) : (
          focused && (
            <ParticipantTile
              {...focused}
              isSpeaking={speakingIds.has(focused.userId)}
              isCurrentSpeaker={focused.userId === currentSpeakerUserId}
              className="h-full ring-0"
            />
          )
        )}
      </div>

      {filmstrip.length > 0 && (
        <div className="flex shrink-0 gap-3 overflow-x-auto pb-1">
          {filmstrip.map((p) => (
            <ParticipantTile
              key={p.userId}
              {...p}
              isSpeaking={speakingIds.has(p.userId)}
              isCurrentSpeaker={p.userId === currentSpeakerUserId}
              className="aspect-video w-40 shrink-0 sm:w-48"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScreenSurface({ stream }: { stream: MediaStream }) {
  return (
    <video
      autoPlay
      playsInline
      muted
      className="h-full w-full bg-black object-contain"
      ref={(el) => {
        if (el && el.srcObject !== stream) el.srcObject = stream;
      }}
    />
  );
}
