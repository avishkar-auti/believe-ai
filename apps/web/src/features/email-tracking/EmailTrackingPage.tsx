import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { Badge } from "../../components/ui/Badge.js";
import { Button } from "../../components/ui/Button.js";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { fetchEmailTracking } from "./emailTrackingApi.js";
import { EMAIL_LOG_STATUS_TONE } from "./statusTone.js";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const COLUMNS = ["Contact", "Campaign", "Step", "Status", "Opens", "Clicks", "Sent"];

export function EmailTrackingPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["email-tracking", page],
    queryFn: () => fetchEmailTracking({ page }),
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Outreach" title="Email Tracking" description="Delivery, opens, clicks, and replies across every campaign." />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-accent" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          {/* The real column structure, shown dimmed, so the empty state previews
              what this page actually tracks instead of just saying "nothing here". */}
          <table className="w-full text-left text-sm opacity-40">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-fg-subtle">
                {COLUMNS.map((c) => (
                  <th key={c} className="py-2.5 pl-6 pr-4 font-medium first:pl-6">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
          <div className="flex flex-col items-center gap-3 border-t border-line px-6 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-label font-medium text-fg">No sends yet</p>
              <p className="mt-1 text-caption text-fg-subtle">Launch a campaign to start seeing delivery and engagement here.</p>
            </div>
            <Link to="/app/campaigns">
              <Button size="sm" variant="secondary">
                View campaigns
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-card border border-line bg-surface p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-fg-subtle">
                  <th className="py-2 pr-4 font-medium">Contact</th>
                  <th className="py-2 pr-4 font-medium">Campaign</th>
                  <th className="py-2 pr-4 font-medium">Step</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Opens</th>
                  <th className="py-2 pr-4 font-medium">Clicks</th>
                  <th className="py-2 pr-4 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5 pr-4">
                      <div className="text-fg">{entry.contactName || entry.contactEmail}</div>
                      <div className="text-xs text-fg-subtle">{entry.contactEmail}</div>
                    </td>
                    <td className="py-2.5 pr-4 text-fg-muted">{entry.campaignName}</td>
                    <td className="py-2.5 pr-4 text-fg-subtle">{entry.stepIndex === 0 ? "Initial" : `Follow-up ${entry.stepIndex}`}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={EMAIL_LOG_STATUS_TONE[entry.status]}>{entry.status}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-fg-muted">{entry.openCount}</td>
                    <td className="py-2.5 pr-4 text-fg-muted">{entry.clickCount}</td>
                    <td className="py-2.5 pr-4 text-fg-subtle">{formatDate(entry.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-fg-subtle">
              <span>
                Page {data.page} of {data.totalPages} &middot; {data.total.toLocaleString()} total
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
        </div>
      )}
    </div>
  );
}
