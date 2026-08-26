import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Plus, Users } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Card } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { fetchCampaigns } from "./campaignsApi.js";
import { CAMPAIGN_STATUS_DOT, CAMPAIGN_STATUS_TONE } from "./statusTone.js";

export function CampaignsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Campaigns</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">Every outreach effort, tracked end to end.</p>
        </div>
        <Link to="/app/campaigns/new">
          <Button>
            <Plus className="h-4 w-4" /> Create campaign
          </Button>
        </Link>
      </motion.div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6 text-brand-500" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No campaigns yet."
          description="Your first campaign could be the beginning of your next opportunity."
          action={
            <Link to="/app/campaigns/new">
              <Button size="sm">Create campaign</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {data.map((c, i) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <Link
                  to={`/app/campaigns/${c.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:hover:bg-ink-800/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${CAMPAIGN_STATUS_DOT[c.status]}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink-900 dark:text-white">{c.name}</div>
                      <div className="truncate text-xs text-ink-400">{c.subject}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="hidden items-center gap-1.5 text-xs text-ink-400 sm:flex">
                      <Users className="h-3.5 w-3.5" /> {c.audienceContactIds.length}
                    </span>
                    <Badge tone={CAMPAIGN_STATUS_TONE[c.status]}>{c.status}</Badge>
                    <ChevronRight className="h-4 w-4 text-ink-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink-500 dark:text-ink-600" />
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
