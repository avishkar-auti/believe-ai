import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Star } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { Button } from "../../components/ui/Button.js";
import { fetchRoomByCode, fetchRoomSummary } from "./interviewRoomApi.js";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
            <Sparkles className="h-5 w-5 text-brand-500" /> Session summary
          </h1>
          {room && <p className="text-sm text-ink-500 dark:text-ink-400">{new Date(room.scheduledAt).toLocaleString()}</p>}
        </div>
        <Link to="/app/interview-room">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" /> Back to rooms
          </Button>
        </Link>
      </div>

      {!summary ? (
        <Card>
          <CardBody className="flex items-center justify-center gap-3 py-16 text-sm text-ink-500 dark:text-ink-400">
            <Spinner className="h-5 w-5" /> Generating your summary — this can take a moment…
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardBody className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Group summary</p>
              <p className="text-sm text-ink-700 dark:text-ink-200">{summary.groupSummary}</p>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {summary.perStudent.map((student) => (
              <Card key={student.userId}>
                <CardBody className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-ink-900 dark:text-white">{student.name}</p>
                    {student.averageRating != null && (
                      <span className="flex items-center gap-1 text-sm text-amber-500">
                        <Star className="h-4 w-4 fill-amber-400" /> {student.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-lime-600 dark:text-lime-400">Strength</p>
                    <p className="text-sm text-ink-700 dark:text-ink-200">{student.strength}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Growth area
                    </p>
                    <p className="text-sm text-ink-700 dark:text-ink-200">{student.growthArea}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
