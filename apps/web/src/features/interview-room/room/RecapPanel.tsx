import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Sparkles } from "lucide-react";
import { Spinner } from "../../../components/ui/Spinner.js";
import { SectionLabel } from "../../../components/ui/Surface.js";
import { fetchRoomRecap } from "../interviewRoomApi.js";

/** Live AI recap of the session so far — same endpoint and polling cadence as
 * before, presented as a running note instead of a card. */
export function RecapPanel({ code, enabled }: { code: string; enabled: boolean }) {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["room-recap", code],
    queryFn: () => fetchRoomRecap(code),
    enabled,
    refetchInterval: 30_000,
  });

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <SectionLabel className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-accent" aria-hidden /> Live recap
        </SectionLabel>
        {isFetching && !isLoading && <RefreshCw className="h-3 w-3 animate-spin text-fg-subtle" aria-label="Refreshing" />}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="flex items-center gap-2 text-label text-fg-muted">
            <Spinner className="h-4 w-4" /> Building recap…
          </p>
        ) : data?.text ? (
          <p className="whitespace-pre-line text-label leading-relaxed text-fg">{data.text}</p>
        ) : (
          <p className="py-8 text-center text-caption text-fg-subtle">
            Not enough of the conversation captured yet to summarise.
          </p>
        )}
      </div>

      {data?.updatedAt && (
        <p className="text-caption text-fg-subtle">Updated {new Date(data.updatedAt).toLocaleTimeString()}</p>
      )}
    </div>
  );
}
