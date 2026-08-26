import { Star } from "lucide-react";
import { cn } from "../../lib/cn.js";

export interface RosterEntry {
  userId: string;
  name: string;
  isSelf?: boolean;
}

export function RoomRoster({
  entries,
  currentSpeakerUserId,
  averageRatings,
}: {
  entries: RosterEntry[];
  currentSpeakerUserId: string | null;
  /** Peer-rating average per userId, once at least one rating exists for them. */
  averageRatings?: Map<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry) => {
        const speaking = entry.userId === currentSpeakerUserId;
        const rating = averageRatings?.get(entry.userId);
        return (
          <span
            key={entry.userId}
            className={cn(
              "flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors",
              speaking
                ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300"
                : "border-ink-200 text-ink-600 dark:border-ink-700 dark:text-ink-300",
            )}
          >
            {speaking && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand-500" />}
            {entry.name}
            {entry.isSelf ? " (you)" : ""}
            {rating != null && (
              <span className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-amber-400" />
                {rating.toFixed(1)}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
