import { useQuery } from "@tanstack/react-query";
import { Card, CardBody } from "../../components/ui/Card.js";
import { fetchAuditLogs } from "./auditApi.js";
import { ACTION_LABELS, describe, timeAgo } from "./activityLabels.js";

export function RecentActivityCard() {
  const { data } = useQuery({ queryKey: ["auditLogs"], queryFn: () => fetchAuditLogs(8) });

  return (
    <Card>
      <CardBody>
        <h2 className="mb-3 font-medium text-fg">Recent activity</h2>

        {!data || data.items.length === 0 ? (
          <p className="text-sm text-fg-muted">Your account activity will show up here as you work.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {data.items.map((log) => {
              const detail = describe(log);
              return (
                <li key={log.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-fg">
                    {ACTION_LABELS[log.action] ?? log.action}
                    {detail && <span className="ml-2 text-fg-subtle">{detail}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-fg-subtle">{timeAgo(log.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
