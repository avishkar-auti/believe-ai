import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Users } from "lucide-react";
import type { InsightActionCard } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Modal } from "../../components/ui/Modal.js";
import { fetchCampaignInsights, fetchInsightCards, generateFollowUp } from "./campaignsApi.js";
import { createTemplate, previewTemplate } from "../templates/templatesApi.js";
import { ApiError } from "../../lib/apiClient.js";

const CARD_ICON: Record<InsightActionCard["icon"], typeof TrendingUp> = { trending: TrendingUp, users: Users };
const CARD_TINT: Record<InsightActionCard["icon"], string> = {
  trending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  users: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export function AiInsightsPanel({ campaignId, sent }: { campaignId: string; sent: number }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: cards } = useQuery({
    queryKey: ["campaign", campaignId, "insight-cards"],
    queryFn: () => fetchInsightCards(campaignId),
    enabled: sent > 0,
    refetchInterval: 15_000,
  });

  const insightsMutation = useMutation({ mutationFn: () => fetchCampaignInsights(campaignId) });

  const followUpMutation = useMutation({
    mutationFn: () => generateFollowUp(campaignId),
    onSuccess: (result) => {
      setDraft({ subject: result.subject, body: result.body });
      setSaved(false);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rendered = await previewTemplate({ subject: draft!.subject, body: draft!.body, bodyFormat: "text", values: {} });
      return createTemplate({ name: templateName, subject: rendered.subject, body: rendered.body, bodyFormat: "html" });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
      setSaved(true);
    },
  });

  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <h2 className="font-medium text-ink-900 dark:text-white">AI Insights</h2>
          </div>
          <Button
            size="sm"
            onClick={() => followUpMutation.mutate()}
            disabled={followUpMutation.isPending || sent === 0}
            title={sent === 0 ? "Available once this campaign has sent some emails" : undefined}
          >
            <Sparkles className="h-3.5 w-3.5" /> {followUpMutation.isPending ? "Drafting…" : "Generate Personalized Follow-Up"}
          </Button>
        </div>

        {sent === 0 ? (
          <p className="text-sm text-ink-500 dark:text-ink-400">Available once this campaign has sent some emails.</p>
        ) : (
          <div className="space-y-4">
            {cards && cards.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {cards.map((card, i) => {
                  const Icon = CARD_ICON[card.icon];
                  return (
                    <div key={i} className={`flex gap-3 rounded-xl p-3.5 ${CARD_TINT[card.icon]}`}>
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">{card.title}</p>
                        <p className="mt-0.5 opacity-80">{card.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {followUpMutation.isError && (
              <p className="text-sm text-red-600">
                {followUpMutation.error instanceof ApiError ? followUpMutation.error.message : "Couldn't draft a follow-up right now."}
              </p>
            )}

            <div className="border-t border-ink-100 pt-3 dark:border-ink-800">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Performance summary</p>
                <Button variant="ghost" size="sm" onClick={() => insightsMutation.mutate()} disabled={insightsMutation.isPending}>
                  {insightsMutation.isPending ? "Analyzing…" : "Generate"}
                </Button>
              </div>
              {insightsMutation.isError ? (
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
                <p className="text-sm text-ink-500 dark:text-ink-400">Get an AI read on what worked and what to improve.</p>
              )}
            </div>
          </div>
        )}
      </CardBody>

      <Modal open={Boolean(draft)} onClose={() => setDraft(null)} title="Personalized follow-up draft" subtitle="Grounded in this campaign's real engagement">
        {draft && (
          <div className="space-y-3">
            <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
            <Textarea rows={10} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            <div className="flex items-center gap-2">
              <Input placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              <Button onClick={() => saveMutation.mutate()} disabled={!templateName || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : "Save as template"}
              </Button>
            </div>
            {saved && <p className="text-sm text-positive">Saved — find it under Templates.</p>}
          </div>
        )}
      </Modal>
    </Card>
  );
}
