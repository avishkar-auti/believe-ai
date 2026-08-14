import { useQuery } from "@tanstack/react-query";
import type { AuditAction, AuditLog } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";
import { fetchAuditLogs } from "./auditApi.js";

const ACTION_LABELS: Record<AuditAction, string> = {
  "campaign.created": "Campaign created",
  "campaign.launched": "Campaign launched",
  "campaign.paused": "Campaign paused",
  "campaign.resumed": "Campaign resumed",
  "campaign.cancelled": "Campaign cancelled",
  "contacts.imported": "Contacts imported",
  "template.deleted": "Template deleted",
  "integration.connected": "Integration connected",
  "integration.disconnected": "Integration disconnected",
  "job.created": "Job posted",
  "job.updated": "Job updated",
  "job.deleted": "Job deleted",
  "job_intel.analyzed": "Job analyzed",
  "outreach_draft.generated": "Outreach drafts generated",
  "outreach_draft.decided": "Outreach draft reviewed",
  "outreach_draft.sent": "Outreach sent",
  "outreach_draft.replied": "Contact marked replied",
  "job_lead.discovered": "Contacts discovered",
  "job_lead.added_to_contact": "Discovered contact added",
};

/** Turns the entry's safe metadata into a short human detail line. */
function describe(log: AuditLog): string {
  const { name, provider, imported } = log.metadata;
  if (typeof name === "string") return name;
  if (typeof provider === "string") return provider;
  if (typeof imported === "number") return `${imported} imported`;
  return "";
}

function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function RecentActivityCard() {
  const { data } = useQuery({ queryKey: ["auditLogs"], queryFn: () => fetchAuditLogs(8) });

  return (
    <Card>
      <CardBody>
        <h2 className="mb-3 font-medium text-ink-900 dark:text-white">Recent activity</h2>

        {!data || data.items.length === 0 ? (
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Your account activity will show up here as you work.
          </p>
        ) : (
          <ul className="divide-y divide-ink-100 text-sm dark:divide-ink-800">
            {data.items.map((log) => {
              const detail = describe(log);
              return (
                <li key={log.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-ink-800 dark:text-ink-100">
                    {ACTION_LABELS[log.action] ?? log.action}
                    {detail && <span className="ml-2 text-ink-400">{detail}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-ink-400">{timeAgo(log.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
