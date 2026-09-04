import { ArrowLeft, Circle, Copy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge.js";
import { Tooltip } from "../../../components/ui/Tooltip.js";
import { toast } from "../../../components/ui/Toast.js";
import { formatClock } from "./roomFormat.js";
import { cn } from "../../../lib/cn.js";

/**
 * The room's own chrome. The live route runs outside the dashboard shell, so
 * this bar owns identity (topic / code), session state and the way back out.
 */
export function RoomHeader({
  code,
  topic,
  status,
  participantCount,
  capacity,
  startedAt,
  className,
}: {
  code: string;
  topic: string | null;
  status: "connecting" | "waiting" | "active" | "ended" | "error";
  participantCount: number;
  capacity: number;
  startedAt: number | null;
  className?: string;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setElapsed((Date.now() - startedAt) / 1000);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const stateLabel: Record<typeof status, string> = {
    connecting: "Connecting",
    waiting: "Waiting for peers",
    active: "Live",
    ended: "Session ended",
    error: "Connection problem",
  };

  return (
    <header
      className={cn(
        "surface-2 surface-edge flex items-center gap-3 rounded-2xl px-3 py-2.5 sm:px-4",
        className,
      )}
    >
      <Tooltip label="Back to practice rooms" side="top">
        <Link
          to="/app/interview-room"
          className="grid h-9 w-9 place-items-center rounded-pill text-fg-muted transition-colors hover:bg-fg/[0.06] hover:text-fg"
          aria-label="Back to practice rooms"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Tooltip>

      <div className="min-w-0 flex-1">
        <p className="truncate text-h3 text-fg">{topic ?? "Group practice room"}</p>
        <div className="mt-0.5 flex items-center gap-2 text-caption text-fg-subtle">
          <span className="font-mono uppercase tracking-wider">{code}</span>
          {startedAt !== null && status === "active" && (
            <>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{formatClock(elapsed)}</span>
            </>
          )}
        </div>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <Badge tone={status === "active" ? "success" : status === "error" ? "danger" : "neutral"}>
          <Circle
            className={cn("mr-1 h-2 w-2 fill-current", status === "active" && "animate-pulse")}
            aria-hidden
          />
          {stateLabel[status]}
        </Badge>
        <Badge tone="neutral">
          <Users className="mr-1 h-3 w-3" aria-hidden /> {participantCount}/{capacity}
        </Badge>
      </div>

      <Tooltip label="Copy invite link" side="top">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard
              .writeText(window.location.href)
              .then(() => toast("Invite link copied"))
              .catch(() => toast("Couldn't copy the link", "danger"));
          }}
          className="grid h-9 w-9 place-items-center rounded-pill text-fg-muted transition-colors hover:bg-fg/[0.06] hover:text-fg"
          aria-label="Copy invite link"
        >
          <Copy className="h-4 w-4" />
        </button>
      </Tooltip>
    </header>
  );
}
