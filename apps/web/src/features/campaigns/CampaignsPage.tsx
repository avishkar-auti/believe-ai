import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, FileText, Megaphone, Plus, Rocket, Send, Trash2, Users } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Card } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { MOTION } from "../../lib/motion.js";
import { deleteCampaign, fetchCampaigns } from "./campaignsApi.js";
import { CAMPAIGN_STATUS_DOT, CAMPAIGN_STATUS_TONE } from "./statusTone.js";

// Mirrors CreateCampaignPage's real step sequence (StepTitle calls at step
// 1-5) — shown in the empty state so a first-time user knows what they're
// about to walk into, not a decorative list invented for this page.
const CREATE_STEPS = [
  { icon: Send, title: "Campaign details", description: "Name it and set the first email your recipients see." },
  { icon: Users, title: "Choose your audience", description: "Select the contacts who should receive it." },
  { icon: FileText, title: "Opening message", description: "Pick an approved template as the first touchpoint." },
  { icon: Rocket, title: "Review and launch", description: "Confirm audience, message, and follow-up timing." },
];

export function CampaignsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: MOTION.slow, ease: "easeOut" }}>
        <PageHeader
          eyebrow="Outreach"
          title="Campaigns"
          description="Every outreach effort, tracked end to end."
          actions={
            <Link to="/app/campaigns/new">
              <Button>
                <Plus className="h-4 w-4" /> Create campaign
              </Button>
            </Link>
          }
        />
      </motion.div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6 text-accent" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col items-start justify-center rounded-card border border-line bg-surface p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Megaphone className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-h2 text-fg">No campaigns yet</h2>
            <p className="mt-1.5 max-w-sm text-label text-fg-muted">
              Your first campaign could be the beginning of your next opportunity.
            </p>
            <Link to="/app/campaigns/new" className="mt-5">
              <Button>
                <Plus className="h-4 w-4" /> Create campaign
              </Button>
            </Link>
          </div>

          <div className="rounded-card border border-line bg-surface p-6">
            <p className="mb-4 text-section uppercase text-fg-subtle">What creating one looks like</p>
            <ol className="space-y-4">
              {CREATE_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong text-caption font-semibold text-fg-subtle">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-label font-medium text-fg">{s.title}</p>
                    <p className="text-caption text-fg-subtle">{s.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {data.map((c, i) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="group flex items-center gap-1 transition-colors hover:bg-fg/[0.03]"
              >
                <Link
                  to={`/app/campaigns/${c.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4 px-5 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${CAMPAIGN_STATUS_DOT[c.status]}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-fg">{c.name}</div>
                      <div className="truncate text-xs text-fg-subtle">{c.subject}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="hidden items-center gap-1.5 text-xs text-fg-subtle sm:flex">
                      <Users className="h-3.5 w-3.5" /> {c.audienceContactIds.length}
                    </span>
                    <Badge tone={CAMPAIGN_STATUS_TONE[c.status]}>{c.status}</Badge>
                    <ChevronRight className="h-4 w-4 text-fg-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-fg-muted" />
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${c.name}`}
                  onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                  className="mr-3 shrink-0 rounded-control p-2 text-fg-subtle opacity-0 transition-colors hover:bg-critical/10 hover:text-critical focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This permanently deletes the campaign. Recipients who already received an email keep it — this only removes the campaign record itself."
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
