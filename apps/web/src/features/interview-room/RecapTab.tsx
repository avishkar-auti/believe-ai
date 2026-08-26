import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { fetchRoomRecap } from "./interviewRoomApi.js";

/** Polls the throttled recap endpoint every 45s — the server-side throttle in
 * mockInterviewRoom.service.ts absorbs any faster polling from other tabs, so
 * this interval is about freshness for this tab, not about limiting LLM calls. */
const POLL_INTERVAL_MS = 45_000;

export function RecapTab({ code, enabled }: { code: string; enabled: boolean }) {
  const { data: recap, isLoading } = useQuery({
    queryKey: ["mock-interview-recap", code],
    queryFn: () => fetchRoomRecap(code),
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
  });

  return (
    <Card>
      <CardBody className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
          <RefreshCw className="h-3 w-3" /> Live recap
        </p>
        {isLoading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-ink-500 dark:text-ink-400">
            <Spinner className="h-4 w-4" /> Building recap…
          </div>
        ) : (
          <p className="text-sm text-ink-700 dark:text-ink-200">
            {recap?.text ?? "Not enough captured yet to summarize."}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
