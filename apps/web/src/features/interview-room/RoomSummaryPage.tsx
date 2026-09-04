import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Sparkles, Star, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { SectionLabel, Surface } from "../../components/ui/Surface.js";
import { fetchRoomByCode, fetchRoomSummary } from "./interviewRoomApi.js";
import { avatarTint, initials } from "./room/roomFormat.js";
import { cn } from "../../lib/cn.js";

/** The summary job runs in the background after a host ends the room — this
 * page polls until it's populated rather than assuming it's ready on load. */
const POLL_INTERVAL_MS = 8_000;

export function RoomSummaryPage() {
  const { code = "" } = useParams<{ code: string }>();

  const { data: room } = useQuery({ queryKey: ["mock-interview-room", code], queryFn: () => fetchRoomByCode(code) });
  const { data: summary } = useQuery({
    queryKey: ["mock-interview-summary", code],
    queryFn: () => fetchRoomSummary(code),
    refetchInterval: (query) => (query.state.data ? false : POLL_INTERVAL_MS),
  });

  const scheduled = room ? new Date(room.scheduledAt) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Session recap"
        description={
          scheduled
            ? `${room?.topic ? `${room.topic} · ` : ""}${scheduled.toLocaleString()} · ${room?.durationMinutes} min`
            : "Your AI recap of the practice session"
        }
        actions={
          <Link to="/app/interview-room">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" /> All rooms
            </Button>
          </Link>
        }
      />

      {!summary ? (
        <Surface level={2} className="p-10 text-center">
          <Spinner className="mx-auto h-5 w-5" />
          <p className="mt-3 text-h3 text-fg">Writing your recap</p>
          <p className="mt-1 text-sm text-fg-muted">
            The AI is working through the transcript and peer ratings. This page updates itself.
          </p>
        </Surface>
      ) : (
        <>
          <Surface level={2} className="relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-accent/15 blur-3xl" aria-hidden />
            <div className="relative">
              <SectionLabel className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-accent" aria-hidden /> Group summary
              </SectionLabel>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg">{summary.groupSummary}</p>
              <p className="mt-4 text-caption text-fg-subtle">
                Generated {new Date(summary.generatedAt).toLocaleString()}
              </p>
            </div>
          </Surface>

          <div>
            <SectionLabel className="mb-3">Per person · {summary.perStudent.length}</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {summary.perStudent.map((student) => (
                <Surface key={student.userId} level={2} className="p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-pill text-label font-semibold",
                        avatarTint(student.userId),
                      )}
                      aria-hidden
                    >
                      {initials(student.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-h3 text-fg">{student.name}</p>
                      {student.averageRating != null && (
                        <p className="flex items-center gap-1 text-caption text-fg-muted">
                          <Star className="h-3 w-3 fill-current text-caution" aria-hidden />
                          {student.averageRating.toFixed(1)} peer average
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-section uppercase text-positive">
                        <ArrowUpRight className="h-3 w-3" aria-hidden /> Strength
                      </p>
                      <p className="mt-1 text-label leading-relaxed text-fg">{student.strength}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-section uppercase text-caution">
                        <TrendingUp className="h-3 w-3" aria-hidden /> Growth area
                      </p>
                      <p className="mt-1 text-label leading-relaxed text-fg">{student.growthArea}</p>
                    </div>
                  </div>
                </Surface>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
