import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import {
  Users,
  Mail,
  Zap,
  CalendarClock,
  ChevronRight,
  ChevronDown,
  Settings,
  Info,
  Sparkles,
  Rocket,
  Clock3,
} from "lucide-react";
import { fetchDashboard } from "./dashboardApi.js";
import { DateRangePicker } from "./DateRangePicker.js";
import { defaultWeekRange, type DateRange } from "./dateRange.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Button } from "../../components/ui/Button.js";
import { CAMPAIGN_STATUS_DOT, CAMPAIGN_STATUS_TONE } from "../campaigns/statusTone.js";
import { RecentActivityCard } from "../audit/RecentActivityCard.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { cn } from "../../lib/cn.js";

const STAT_CARDS: {
  key: "totalContacts" | "emailsSent" | "activeCampaigns" | "scheduledCampaigns";
  label: string;
  icon: typeof Users;
  iconClass: string;
  sparkClass: string;
}[] = [
  {
    key: "totalContacts",
    label: "Total contacts",
    icon: Users,
    iconClass: "bg-brand-500/10 text-brand-600 dark:text-brand-300",
    sparkClass: "text-brand-400",
  },
  {
    key: "emailsSent",
    label: "Emails sent",
    icon: Mail,
    iconClass: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
    sparkClass: "text-lime-500",
  },
  {
    key: "activeCampaigns",
    label: "Active campaigns",
    icon: Zap,
    iconClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    sparkClass: "text-amber-500",
  },
  {
    key: "scheduledCampaigns",
    label: "Scheduled",
    icon: CalendarClock,
    iconClass: "bg-ink-500/10 text-ink-600 dark:bg-ink-300/10 dark:text-ink-300",
    sparkClass: "text-ink-400",
  },
];

const ENGAGEMENT_RINGS: { key: "openRate" | "clickRate" | "replyRate"; label: string; color: string }[] = [
  { key: "openRate", label: "Open rate", color: "#4353FF" },
  { key: "clickRate", label: "Click rate", color: "#8BC34A" },
  { key: "replyRate", label: "Reply rate", color: "#FF7A2F" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: "easeOut" as const },
  }),
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const [range, setRange] = useState<DateRange>(() => defaultWeekRange(new Date()));

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  const engagementData = ENGAGEMENT_RINGS.map((r) => ({ name: r.label, value: data[r.key], fill: r.color }));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">Believe it — here's how outreach is going.</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          <Link
            to="/app/settings"
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 hover:shadow-card dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, iconClass, sparkClass }, i) => (
          <motion.div key={key} custom={i} initial="hidden" animate="visible" variants={cardVariants} className="group">
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <CardBody className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
                      iconClass,
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="truncate text-sm text-ink-500 dark:text-ink-400">{label}</span>
                </div>
                <div className="text-3xl font-bold tabular-nums text-ink-900 dark:text-white">
                  <AnimatedNumber value={data[key]} />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-ink-400">vs last 7 days</span>
                  <MiniSparkline className={sparkClass} seed={i} />
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="transition-shadow duration-300 hover:shadow-lift">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 font-medium text-ink-900 dark:text-white">
                Engagement overview
                <Info className="h-3.5 w-3.5 text-ink-300 dark:text-ink-600" />
              </h2>
              <span className="inline-flex cursor-default items-center gap-1.5 rounded-pill border border-ink-200 px-3 py-1 text-xs font-medium text-ink-500 transition-colors duration-200 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:text-ink-400">
                All campaigns
                <ChevronDown className="h-3 w-3" />
              </span>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-[1.3]">
                <div className="relative mx-auto h-40 w-40 shrink-0 sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="35%"
                      outerRadius="100%"
                      barSize={10}
                      data={engagementData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={6} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold tabular-nums tracking-tight text-ink-900 dark:text-white">
                      {data.openRate}%
                    </span>
                    <span className="text-[11px] text-ink-400">open rate</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {ENGAGEMENT_RINGS.map((r) => (
                    <div key={r.key} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.label}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium tabular-nums text-ink-900 dark:text-white">{data[r.key]}%</span>
                        <span className="text-xs tabular-nums text-ink-300 dark:text-ink-600">— 0%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-brand-500/[0.06] p-4 transition-colors duration-300 hover:bg-brand-500/[0.1] dark:bg-brand-400/[0.08] lg:flex-1">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm dark:bg-ink-800 dark:text-brand-300">
                    <Rocket className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 dark:text-white">Top performance tip</p>
                    <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                      Start by creating your first campaign and track engagement here.
                    </p>
                  </div>
                </div>
                <Link
                  to="/app/campaigns/new"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-card"
                >
                  Create campaign
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <p className="flex items-center gap-1.5 border-t border-ink-100 pt-3 text-xs text-ink-400 dark:border-ink-700">
              <Clock3 className="h-3.5 w-3.5" />
              Engagement data updates every 30 minutes.
            </p>
          </CardBody>
        </Card>
      </motion.div>

      <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="transition-shadow duration-300 hover:shadow-lift">
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium text-ink-900 dark:text-white">Recent campaigns</h2>
              <Link to="/app/campaigns">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>

            {data.recentCampaigns.length === 0 ? (
              <EmptyState
                icon={
                  <div className="relative mb-1">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:text-brand-300">
                      <Mail className="h-6 w-6" />
                    </span>
                    <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-brand-300 dark:text-brand-500" />
                    <Sparkles className="absolute -bottom-1 -left-2 h-3 w-3 text-amber-400" />
                  </div>
                }
                title="No campaigns yet."
                description="Your first campaign could be the beginning of your next opportunity."
                action={
                  <Link to="/app/campaigns">
                    <Button size="sm">Create campaign</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-1.5">
                {data.recentCampaigns.map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                  >
                    <Link
                      to={`/app/campaigns/${c.id}`}
                      className="group flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:hover:bg-ink-800/60"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn("h-2 w-2 shrink-0 rounded-full", CAMPAIGN_STATUS_DOT[c.status])}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink-900 dark:text-white">{c.name}</div>
                          <div className="truncate text-xs text-ink-400">{c.subject}</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone={CAMPAIGN_STATUS_TONE[c.status]}>{c.status}</Badge>
                        <ChevronRight className="h-4 w-4 text-ink-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink-500 dark:text-ink-600" />
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </motion.div>

      <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariants}>
        <RecentActivityCard />
      </motion.div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{animated.toLocaleString()}</>;
}

/** Purely decorative accent line (not a plotted metric) — a handful of fixed,
 * deterministically-varied paths keyed by `seed` so each stat card's sparkline
 * looks distinct without implying a specific historical trend we don't have data for. */
function MiniSparkline({ className, seed }: { className?: string; seed: number }) {
  const paths = [
    "M0,16 C6,14 10,6 16,8 C22,10 26,4 32,6 C38,8 42,2 48,4",
    "M0,10 C6,4 10,14 16,10 C22,6 26,12 32,8 C38,4 42,10 48,6",
    "M0,6 C6,10 10,4 16,8 C22,12 26,6 32,10 C38,14 42,8 48,12",
    "M0,14 C6,8 10,10 16,4 C22,8 26,6 32,12 C38,10 42,4 48,8",
  ];
  return (
    <svg viewBox="0 0 48 18" width="48" height="18" className={cn("shrink-0 opacity-70", className)} aria-hidden="true">
      <path d={paths[seed % paths.length]} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function DashboardSkeleton() {
  const pulse = "animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800";
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className={`h-7 w-40 ${pulse}`} />
        <div className={`h-4 w-64 ${pulse}`} />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardBody className="space-y-2">
              <div className={`h-4 w-20 ${pulse}`} />
              <div className={`h-7 w-16 ${pulse}`} />
            </CardBody>
          </Card>
        ))}
      </div>
      <Card>
        <CardBody className="flex items-center gap-4">
          <div className={`h-40 w-40 shrink-0 rounded-full ${pulse}`} />
          <div className="flex-1 space-y-3">
            <div className={`h-4 w-24 ${pulse}`} />
            <div className={`h-4 w-full ${pulse}`} />
            <div className={`h-4 w-full ${pulse}`} />
            <div className={`h-4 w-full ${pulse}`} />
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="space-y-3">
          <div className={`h-5 w-36 ${pulse}`} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`h-10 w-full ${pulse}`} />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
