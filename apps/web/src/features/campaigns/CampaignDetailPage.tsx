import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import type { EmailLog, EmailLogStatus, RecipientSegment } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { fetchTemplates } from "../templates/templatesApi.js";
import {
  cancelCampaign,
  fetchCampaign,
  fetchCampaignAnalytics,
  fetchCampaignLinks,
  fetchCampaignProjects,
  fetchCampaignRecipients,
  fetchEngagementTimeseries,
  launchCampaign,
  markRecipientReplied,
  pauseCampaign,
  resumeCampaign,
} from "./campaignsApi.js";
import { CAMPAIGN_STATUS_TONE } from "./statusTone.js";
import { CampaignKpiCards } from "./CampaignKpiCards.js";
import { EngagementFunnel } from "./EngagementFunnel.js";
import { EngagementChart } from "./EngagementChart.js";
import { TopLinksCard } from "./TopLinksCard.js";
import { MostViewedProjects } from "./MostViewedProjects.js";
import { AiInsightsPanel } from "./AiInsightsPanel.js";
import { RecipientPanel } from "./RecipientPanel.js";

const SEGMENT_LABELS: Record<RecipientSegment, string> = {
  opened_no_reply: "Opened, no reply",
  clicked_no_reply: "Clicked, no reply",
  high_engagement_no_reply: "High engagement, no reply",
};

function relativeTime(iso: string | null) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function engagementLabel(log: EmailLog): { label: string; tone: "success" | "info" | "accent" | "neutral" | "danger" } {
  if (log.replied) return { label: "Replied", tone: "success" };
  if (log.clicked) return { label: "Clicked", tone: "accent" };
  if (log.opened) return { label: "Open Detected", tone: "info" };
  if (log.status === "BOUNCED") return { label: "Bounced", tone: "danger" };
  if (log.status === "FAILED") return { label: "Failed", tone: "danger" };
  if (log.status === "QUEUED") return { label: "Queued", tone: "neutral" };
  return { label: "Delivered", tone: "neutral" };
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<EmailLogStatus | "">("");
  const [segmentFilter, setSegmentFilter] = useState<RecipientSegment | "">("");
  const [search, setSearch] = useState("");
  const [activeRecipient, setActiveRecipient] = useState<EmailLog | null>(null);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => fetchCampaign(id!),
    enabled: Boolean(id),
  });
  const { data: analytics } = useQuery({
    queryKey: ["campaign", id, "analytics"],
    queryFn: () => fetchCampaignAnalytics(id!),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
  const { data: recipients } = useQuery({
    queryKey: ["campaign", id, "recipients", statusFilter, segmentFilter, search],
    queryFn: () =>
      fetchCampaignRecipients(id!, 1, {
        status: statusFilter || undefined,
        segment: segmentFilter || undefined,
        search: search.trim() || undefined,
      }),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
  const { data: links } = useQuery({
    queryKey: ["campaign", id, "links"],
    queryFn: () => fetchCampaignLinks(id!),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
  const { data: projects } = useQuery({
    queryKey: ["campaign", id, "projects"],
    queryFn: () => fetchCampaignProjects(id!),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
  const { data: timeseries } = useQuery({
    queryKey: ["campaign", id, "engagement-timeseries"],
    queryFn: () => fetchEngagementTimeseries(id!),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
  const { data: templates } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });

  const templateNameById = new Map((templates ?? []).map((t) => [t.id, t.name]));

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["campaign", id] });
  }

  const launchMutation = useMutation({ mutationFn: () => launchCampaign(id!), onSuccess: invalidate });
  const pauseMutation = useMutation({ mutationFn: () => pauseCampaign(id!), onSuccess: invalidate });
  const resumeMutation = useMutation({ mutationFn: () => resumeCampaign(id!), onSuccess: invalidate });
  const cancelMutation = useMutation({ mutationFn: () => cancelCampaign(id!), onSuccess: invalidate });
  const markRepliedMutation = useMutation({
    mutationFn: (contactId: string) => markRecipientReplied(id!, contactId),
    onSuccess: invalidate,
  });

  if (isLoading || !campaign) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">{campaign.name}</h1>
            <Badge tone={CAMPAIGN_STATUS_TONE[campaign.status]}>{campaign.status}</Badge>
          </div>
          <p className="text-sm text-ink-500 dark:text-ink-400">{campaign.subject}</p>
        </div>
        <div className="flex gap-2">
          {(campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && (
            <Button onClick={() => launchMutation.mutate()} disabled={launchMutation.isPending}>
              Launch
            </Button>
          )}
          {campaign.status === "RUNNING" && (
            <Button variant="secondary" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending}>
              Pause
            </Button>
          )}
          {campaign.status === "PAUSED" && (
            <Button onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending}>
              Resume
            </Button>
          )}
          {["DRAFT", "SCHEDULED", "RUNNING", "PAUSED"].includes(campaign.status) && (
            <Button variant="danger" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {analytics && (
        <>
          <CampaignKpiCards analytics={analytics} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardBody>
                <h2 className="mb-3 font-medium text-ink-900 dark:text-white">Engagement funnel</h2>
                <EngagementFunnel analytics={analytics} />
                <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Bounce tracking needs a provider webhook not yet connected — {analytics.bounced} shown here means "not detected," not
                  "confirmed zero."
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <h2 className="mb-3 font-medium text-ink-900 dark:text-white">Engagement over time</h2>
                <EngagementChart data={timeseries ?? []} />
              </CardBody>
            </Card>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-3 font-medium text-ink-900 dark:text-white">Top clicked links</h2>
            <TopLinksCard links={links ?? []} />
          </CardBody>
        </Card>
        {projects && projects.length > 0 && (
          <Card>
            <CardBody>
              <h2 className="mb-3 font-medium text-ink-900 dark:text-white">Most viewed projects</h2>
              <MostViewedProjects projects={projects} />
            </CardBody>
          </Card>
        )}
      </div>

      <AiInsightsPanel campaignId={id!} sent={analytics?.sent ?? 0} />

      <Card>
        <CardBody>
          <h2 className="mb-3 font-medium text-ink-900 dark:text-white">Sequence</h2>
          <ol className="space-y-2 text-sm">
            <li className="flex items-center gap-3">
              <span className="w-14 shrink-0 font-medium text-ink-500">Day 0</span>
              <span className="text-ink-800 dark:text-ink-100">{campaign.subject}</span>
            </li>
            {campaign.followUps.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-14 shrink-0 font-medium text-ink-500">Day {f.delayDays}</span>
                <span className="text-ink-800 dark:text-ink-100">
                  {f.subjectOverride || templateNameById.get(f.templateId) || "Follow-up"}
                </span>
              </li>
            ))}
          </ol>
          {campaign.followUps.length > 0 && (
            <p className="mt-3 text-xs text-ink-400">
              {campaign.stopOnReply
                ? "Stops automatically once a recipient is marked as replied."
                : "Follow-ups send on schedule regardless of replies."}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium text-ink-900 dark:text-white">Recipient Activity</h2>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search name, email, company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="!h-9 w-48"
              />
              <Select className="!h-9 w-auto" value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value as RecipientSegment | "")}>
                <option value="">All segments</option>
                {(Object.keys(SEGMENT_LABELS) as RecipientSegment[]).map((seg) => (
                  <option key={seg} value={seg}>
                    {SEGMENT_LABELS[seg]}
                  </option>
                ))}
              </Select>
              <Select className="!h-9 w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EmailLogStatus | "")}>
                <option value="">All statuses</option>
                {["QUEUED", "SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED", "BOUNCED", "FAILED"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {!recipients || recipients.items.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {recipients ? "No recipients match these filters." : "No recipients yet — launch the campaign to send."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400 dark:border-ink-800">
                    <th className="py-2 pr-3 font-medium">Recipient</th>
                    <th className="py-2 pr-3 font-medium">Company</th>
                    <th className="py-2 pr-3 font-medium">Delivery</th>
                    <th className="py-2 pr-3 font-medium">Engagement</th>
                    <th className="py-2 pr-3 font-medium">Opens</th>
                    <th className="py-2 pr-3 font-medium">Clicks</th>
                    <th className="py-2 pr-3 font-medium">Reply</th>
                    <th className="py-2 pr-3 font-medium">Last Activity</th>
                    <th className="py-2 pr-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {recipients.items.map((log) => {
                    const engagement = engagementLabel(log);
                    return (
                      <tr key={log.id} className="align-middle">
                        <td className="py-2.5 pr-3">
                          <button type="button" onClick={() => setActiveRecipient(log)} className="text-left hover:underline">
                            <p className="font-medium text-ink-800 dark:text-ink-100">{log.contactName || log.contactId}</p>
                            <p className="text-xs text-ink-400">{log.contactEmail}</p>
                          </button>
                        </td>
                        <td className="py-2.5 pr-3 text-ink-600 dark:text-ink-300">{log.contactCompany || "—"}</td>
                        <td className="py-2.5 pr-3">
                          <Badge tone={log.status === "FAILED" || log.status === "BOUNCED" ? "danger" : "success"}>
                            {log.status === "QUEUED" ? "Queued" : log.status === "FAILED" ? "Failed" : log.status === "BOUNCED" ? "Bounced" : "Delivered"}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-3">
                          <Badge tone={engagement.tone}>{engagement.label}</Badge>
                        </td>
                        <td className="py-2.5 pr-3 text-ink-600 dark:text-ink-300">{log.openCount}</td>
                        <td className="py-2.5 pr-3 text-ink-600 dark:text-ink-300">{log.clickCount}</td>
                        <td className="py-2.5 pr-3 text-ink-600 dark:text-ink-300">{log.replied ? "Yes" : "No"}</td>
                        <td className="py-2.5 pr-3 text-ink-400">{relativeTime(log.lastActivityAt)}</td>
                        <td className="py-2.5 pr-3">
                          {!log.replied && log.status !== "QUEUED" && log.status !== "FAILED" && (
                            <Button variant="ghost" size="sm" onClick={() => markRepliedMutation.mutate(log.contactId)} disabled={markRepliedMutation.isPending}>
                              Mark replied
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <RecipientPanel campaignId={id!} recipient={activeRecipient} onClose={() => setActiveRecipient(null)} />
    </div>
  );
}
