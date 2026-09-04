import { useQuery } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import { Drawer } from "../../components/ui/Drawer.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { Badge } from "../../components/ui/Badge.js";
import { fetchSubmissionHistory } from "./practiceApi.js";

export function SubmissionHistoryPanel({
  open,
  onClose,
  challengeId,
}: {
  open: boolean;
  onClose: () => void;
  challengeId: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["practice-submissions", challengeId],
    queryFn: () => fetchSubmissionHistory(challengeId),
    enabled: open,
  });

  return (
    <Drawer open={open} title="Submission history" subtitle="Past attempts at this challenge" onClose={onClose}>
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-5 w-5 text-fg-subtle" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-fg-muted">No submissions yet for this challenge.</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((s) => (
            <div key={s.id} className="rounded-control border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-caption text-fg-subtle">{new Date(s.createdAt).toLocaleString()}</p>
                {s.solved && (
                  <Badge tone="success" className="flex items-center gap-1 shrink-0">
                    <CircleCheck className="h-3 w-3" /> Solved
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-fg">{s.message}</p>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
