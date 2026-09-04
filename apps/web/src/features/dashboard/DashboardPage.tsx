import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, Cell, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Users, Mail, Zap, CalendarClock, ChevronRight, Settings, Sparkles } from "lucide-react";
import { fetchDashboard } from "./dashboardApi.js";
import { DateRangePicker } from "./DateRangePicker.js";
import { defaultWeekRange, type DateRange } from "./dateRange.js";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Button } from "../../components/ui/Button.js";
import { MOTION } from "../../lib/motion.js";
import { CAMPAIGN_STATUS_TONE } from "../campaigns/statusTone.js";
import { RecentActivityCard } from "../audit/RecentActivityCard.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { cn } from "../../lib/cn.js";

const STAT_CARDS: { key: "totalContacts" | "emailsSent" | "activeCampaigns" | "scheduledCampaigns"; label: string; icon: typeof Users }[] = [
  { key: "totalContacts", label: "Total contacts", icon: Users },
  { key: "emailsSent", label: "Emails sent", icon: Mail },
  { key: "activeCampaigns", label: "Active campaigns", icon: Zap },
  { key: "scheduledCampaigns", label: "Scheduled", icon: CalendarClock },
];

const ENGAGEMENT_BARS: { key: "openRate" | "clickRate" | "replyRate"; label: string; token: string }[] = [
  { key: "openRate", label: "Open rate", token: "rgb(var(--fg-subtle))" },
  { key: "clickRate", label: "Click rate", token: "rgb(var(--positive))" },
  { key: "replyRate", label: "Reply rate", token: "rgb(var(--accent))" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.06, ease: "easeOut" as const } }),
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const [range, setRange] = useState<DateRange>(() => defaultWeekRange(new Date()));

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  const deliveryRate = data.emailsSent > 0 ? Math.round((data.emailsDelivered / data.emailsSent) * 100) : 0;
  const deliveryData = [{ name: "Delivered", value: deliveryRate, fill: "rgb(var(--accent))" }];
  // Real per-campaign audience sizes for the most recent sends — not a
  // fabricated time series, just the actual recipient count of each
  // campaign already shown below, drawn as a shape instead of a list.
  const recipientTrend = [...data.recentCampaigns]
    .reverse()
    .map((c) => ({ name: c.name, recipients: c.audienceContactIds.length }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: MOTION.slow, ease: "easeOut" }}>
        <PageHeader
          eyebrow="Outreach"
          title="Dashboard"
          description="Believe it — here's how outreach is going."
          actions={
            <>
              <DateRangePicker value={range} onChange={setRange} />
              <Link
                to="/app/settings"
                aria-label="Settings"
                className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-surface text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </>
          }
        />
      </motion.div>

      {/* Row 1 — headline volume metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon }, i) => (
          <motion.div key={key} custom={i} initial="hidden" animate="visible" variants={cardVariants} className="rounded-card bg-surface p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
            <span className="flex h-9 w-9 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <p className="mt-3 text-xs text-fg-subtle">{label}</p>
            <p className="font-display text-2xl font-bold tabular-nums text-fg">
              <AnimatedNumber value={data[key]} />
            </p>
          </motion.div>
        ))}
      </div>

      {/* Row 2 — three chart cards, each backed by a real, currently-measured
          number. No invented historical trend lines. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="rounded-card bg-surface p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
        >
          <p className="text-xs font-semibold text-fg-muted">Recipients &middot; recent campaigns</p>
          {recipientTrend.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-fg-subtle">No campaigns sent yet</div>
          ) : (
            <>
              <div className="mt-2 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recipientTrend} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="recipientFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="recipients" stroke="rgb(var(--accent))" strokeWidth={2} fill="url(#recipientFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-fg font-display">{recipientTrend[recipientTrend.length - 1]?.recipients ?? 0}</p>
              <p className="text-xs text-fg-subtle">Recipients on the latest campaign</p>
            </>
          )}
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="rounded-card bg-surface p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
        >
          <p className="text-xs font-semibold text-fg-muted">Delivery rate</p>
          <div className="relative mx-auto mt-2 h-28 w-28">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" barSize={9} data={deliveryData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={5} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-bold tabular-nums text-fg">{deliveryRate}%</span>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-fg-subtle">
            {data.emailsDelivered.toLocaleString()} of {data.emailsSent.toLocaleString()} sent
          </p>
        </motion.div>

        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="rounded-card bg-surface p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
        >
          <p className="mb-3 text-xs font-semibold text-fg-muted">Engagement, this period</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={ENGAGEMENT_BARS.map((b) => ({ ...b, value: data[b.key] }))} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="label" width={64} tick={{ fill: "rgb(var(--fg-subtle))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                  {ENGAGEMENT_BARS.map((b) => (
                    <Cell key={b.key} fill={b.token} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Row 3 — a real table, not a list-styled-as-a-table. */}
      <motion.div custom={7} initial="hidden" animate="visible" variants={cardVariants} className="rounded-card bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-medium text-fg">Recent campaigns</h2>
          <Link to="/app/campaigns">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>

        {data.recentCampaigns.length === 0 ? (
          <EmptyState
            className="border-none py-10"
            icon={
              <span className="flex h-11 w-11 items-center justify-center rounded-control bg-accent-soft text-accent">
                <Sparkles className="h-5 w-5" />
              </span>
            }
            title="No campaigns yet"
            description="Your first campaign could be the beginning of your next opportunity."
            action={
              <Link to="/app/campaigns">
                <Button size="sm">Create campaign</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-fg-subtle">
                  <th className="py-2.5 pl-5 pr-4 font-medium">Campaign</th>
                  <th className="py-2.5 pr-4 font-medium">Recipients</th>
                  <th className="py-2.5 pr-4 font-medium">Status</th>
                  <th className="py-2.5 pr-5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.recentCampaigns.map((c) => (
                  <tr key={c.id} className="group">
                    <td className="py-3 pl-5 pr-4">
                      <Link to={`/app/campaigns/${c.id}`} className="block min-w-0">
                        <div className="truncate font-medium text-fg group-hover:text-accent">{c.name}</div>
                        <div className="truncate text-xs text-fg-subtle">{c.subject}</div>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-fg-muted">{c.audienceContactIds.length}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={CAMPAIGN_STATUS_TONE[c.status]}>{c.status}</Badge>
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <Link to={`/app/campaigns/${c.id}`} className={cn("inline-flex text-fg-subtle transition-colors group-hover:text-fg")}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <motion.div custom={8} initial="hidden" animate="visible" variants={cardVariants}>
        <RecentActivityCard />
      </motion.div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{animated.toLocaleString()}</>;
}

function DashboardSkeleton() {
  const pulse = "animate-pulse rounded-control bg-surface-2";
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className={`h-7 w-40 ${pulse}`} />
        <div className={`h-4 w-64 ${pulse}`} />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-24 rounded-card bg-surface p-4 shadow-card`}>
            <div className={`h-9 w-9 ${pulse}`} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-card bg-surface p-5 shadow-card">
            <div className={`h-28 w-full ${pulse}`} />
          </div>
        ))}
      </div>
      <div className="rounded-card bg-surface p-6 shadow-card space-y-3">
        <div className={`h-5 w-36 ${pulse}`} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`h-10 w-full ${pulse}`} />
        ))}
      </div>
    </div>
  );
}
