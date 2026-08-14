import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { Button } from "../../components/ui/Button.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { fetchEmailTracking } from "./emailTrackingApi.js";
import { EMAIL_LOG_STATUS_TONE } from "./statusTone.js";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function EmailTrackingPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["email-tracking", page],
    queryFn: () => fetchEmailTracking({ page }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Email Tracking</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">Delivery, opens, clicks, and replies across every campaign.</p>
      </div>

      <Card>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="No sends yet" description="Launch a campaign to start seeing delivery and engagement here." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400 dark:border-ink-800">
                      <th className="py-2 pr-4 font-medium">Contact</th>
                      <th className="py-2 pr-4 font-medium">Campaign</th>
                      <th className="py-2 pr-4 font-medium">Step</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Opens</th>
                      <th className="py-2 pr-4 font-medium">Clicks</th>
                      <th className="py-2 pr-4 font-medium">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                    {data.items.map((entry) => (
                      <tr key={entry.id}>
                        <td className="py-2.5 pr-4">
                          <div className="text-ink-800 dark:text-ink-100">{entry.contactName || entry.contactEmail}</div>
                          <div className="text-xs text-ink-400">{entry.contactEmail}</div>
                        </td>
                        <td className="py-2.5 pr-4 text-ink-600 dark:text-ink-300">{entry.campaignName}</td>
                        <td className="py-2.5 pr-4 text-ink-500 dark:text-ink-400">
                          {entry.stepIndex === 0 ? "Initial" : `Follow-up ${entry.stepIndex}`}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge tone={EMAIL_LOG_STATUS_TONE[entry.status]}>{entry.status}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-ink-600 dark:text-ink-300">{entry.openCount}</td>
                        <td className="py-2.5 pr-4 text-ink-600 dark:text-ink-300">{entry.clickCount}</td>
                        <td className="py-2.5 pr-4 text-ink-500 dark:text-ink-400">{formatDate(entry.sentAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-ink-500 dark:text-ink-400">
                  <span>
                    Page {data.page} of {data.totalPages} · {data.total.toLocaleString()} total
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
