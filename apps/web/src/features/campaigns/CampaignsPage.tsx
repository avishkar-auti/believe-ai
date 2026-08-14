import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Card } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { fetchCampaigns } from "./campaignsApi.js";
import { CAMPAIGN_STATUS_TONE } from "./statusTone.js";

export function CampaignsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Campaigns</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">Every outreach effort, tracked end to end.</p>
        </div>
        <Link to="/app/campaigns/new">
          <Button>
            <Plus className="h-4 w-4" /> Create campaign
          </Button>
        </Link>
      </div>

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
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-ink-500 dark:border-ink-800 dark:text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Audience</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {data.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3">
                      <Link to={`/app/campaigns/${c.id}`} className="font-medium text-ink-900 hover:underline dark:text-white">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{c.subject}</td>
                    <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{c.audienceContactIds.length}</td>
                    <td className="px-5 py-3">
                      <Badge tone={CAMPAIGN_STATUS_TONE[c.status]}>{c.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
