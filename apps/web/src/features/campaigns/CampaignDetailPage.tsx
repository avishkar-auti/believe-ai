import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { Button } from "../../components/ui/Button.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { fetchTemplates } from "../templates/templatesApi.js";
import { fetchContacts } from "../contacts/contactsApi.js";
import {
  cancelCampaign,
  fetchCampaign,
  fetchCampaignAnalytics,
  fetchCampaignInsights,
  fetchCampaignRecipients,
  launchCampaign,
  markRecipientReplied,
  pauseCampaign,
  resumeCampaign,
} from "./campaignsApi.js";
import { CAMPAIGN_STATUS_TONE } from "./statusTone.js";

const ANALYTICS_LABELS: { key: "sent" | "openRate" | "clickRate" | "replyRate"; label: string; suffix?: string }[] = [
  { key: "sent", label: "Sent" },
  { key: "openRate", label: "Open rate", suffix: "%" },
  { key: "clickRate", label: "Click rate", suffix: "%" },
  { key: "replyRate", label: "Reply rate", suffix: "%" },
];

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

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
    queryKey: ["campaign", id, "recipients"],
    queryFn: () => fetchCampaignRecipients(id!),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
  const { data: templates } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });
  const { data: contactsPage } = useQuery({
    queryKey: ["contacts", "for-campaign-detail"],
    queryFn: () => fetchContacts({ page: 1 }),
  });

  const templateNameById = new Map((templates ?? []).map((t) => [t.id, t.name]));
  const contactById = new Map((contactsPage?.items ?? []).map((c) => [c.id, c]));

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
  const insightsMutation = useMutation({ mutationFn: () => fetchCampaignInsights(id!) });

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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ANALYTICS_LABELS.map(({ key, label, suffix }) => (
            <Card key={key}>
              <CardBody>
                <div className="text-sm text-ink-500 dark:text-ink-400">{label}</div>
                <div className="mt-1 text-2xl font-semibold text-ink-900 dark:text-white">
                  {analytics[key]}
                  {suffix}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardBody>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-500" />
              <h2 className="font-medium text-ink-900 dark:text-white">AI Insights</h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => insightsMutation.mutate()}
              disabled={insightsMutation.isPending || !analytics || analytics.sent === 0}
            >
              {insightsMutation.isPending ? "Analyzing…" : "Generate insights"}
            </Button>
          </div>
          {!analytics || analytics.sent === 0 ? (
            <p className="text-sm text-ink-500 dark:text-ink-400">Available once this campaign has sent some emails.</p>
          ) : insightsMutation.isError ? (
            <p className="text-sm text-red-600">Couldn't generate insights. Check your AI provider configuration.</p>
          ) : insightsMutation.data ? (
            <div className="space-y-3 text-sm">
              <p className="text-ink-800 dark:text-ink-100">{insightsMutation.data.summary}</p>
              {insightsMutation.data.whatWorked.length > 0 && (
                <div>
                  <p className="font-medium text-ink-700 dark:text-ink-200">What worked</p>
                  <ul className="list-inside list-disc text-ink-600 dark:text-ink-300">
                    {insightsMutation.data.whatWorked.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {insightsMutation.data.whatToImprove.length > 0 && (
                <div>
                  <p className="font-medium text-ink-700 dark:text-ink-200">What could improve</p>
                  <ul className="list-inside list-disc text-ink-600 dark:text-ink-300">
                    {insightsMutation.data.whatToImprove.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Get an AI read on what worked and what to improve, based on this campaign's numbers.
            </p>
          )}
        </CardBody>
      </Card>

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
          <h2 className="mb-3 font-medium text-ink-900 dark:text-white">Recipients</h2>
          {!recipients || recipients.items.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-ink-400">No recipients yet — launch the campaign to send.</p>
          ) : (
            <ul className="divide-y divide-ink-100 text-sm dark:divide-ink-800">
              {recipients.items.map((log) => {
                const contact = contactById.get(log.contactId);
                return (
                  <li key={log.id} className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-ink-800 dark:text-ink-100">
                        {contact ? `${contact.firstName} ${contact.lastName}`.trim() || contact.email : log.contactId}
                      </span>
                      <span className="ml-2 text-xs text-ink-400">step {log.stepIndex}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={log.status === "FAILED" ? "danger" : log.status === "QUEUED" ? "neutral" : "success"}>
                        {log.status}
                      </Badge>
                      {!log.replied && log.status !== "QUEUED" && log.status !== "FAILED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markRepliedMutation.mutate(log.contactId)}
                          disabled={markRepliedMutation.isPending}
                        >
                          Mark replied
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
