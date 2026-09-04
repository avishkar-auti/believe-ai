import { Crown, Mic, MicOff, Star } from "lucide-react";
import { SectionLabel } from "../../../components/ui/Surface.js";
import { avatarTint, initials } from "./roomFormat.js";
import { cn } from "../../../lib/cn.js";

export interface PersonEntry {
  userId: string;
  name: string;
  isLocal: boolean;
  isHost: boolean;
  micOn: boolean;
  averageRating?: number | null;
}

/** Roster with real presence, host marker, turn owner and peer-rating average. */
export function PeoplePanel({
  people,
  currentSpeakerUserId,
  speakingIds,
  minParticipants,
}: {
  people: PersonEntry[];
  currentSpeakerUserId: string | null;
  speakingIds: Set<string>;
  minParticipants: number;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      <SectionLabel>
        In the room · {people.length} {people.length < minParticipants ? `(needs ${minParticipants})` : ""}
      </SectionLabel>

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {people.map((p) => {
          const speaking = speakingIds.has(p.userId);
          return (
            <li
              key={p.userId}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-2.5 py-2",
                p.userId === currentSpeakerUserId && "bg-accent-soft",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-pill text-caption font-semibold ring-2",
                  avatarTint(p.userId),
                  speaking ? "ring-positive" : "ring-transparent",
                )}
                aria-hidden
              >
                {initials(p.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-label font-medium text-fg">
                    {p.name}
                    {p.isLocal && " (you)"}
                  </span>
                  {p.isHost && <Crown className="h-3 w-3 shrink-0 text-caution" aria-label="Host" />}
                </span>
                {p.userId === currentSpeakerUserId && <span className="text-caption text-accent">Answering now</span>}
              </span>
              {typeof p.averageRating === "number" && (
                <span className="flex shrink-0 items-center gap-0.5 text-caption text-fg-muted">
                  <Star className="h-3 w-3 fill-current text-caution" aria-hidden />
                  {p.averageRating.toFixed(1)}
                </span>
              )}
              {p.micOn ? (
                <Mic className={cn("h-3.5 w-3.5 shrink-0", speaking ? "text-positive" : "text-fg-subtle")} aria-label="Mic on" />
              ) : (
                <MicOff className="h-3.5 w-3.5 shrink-0 text-critical" aria-label="Mic off" />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
