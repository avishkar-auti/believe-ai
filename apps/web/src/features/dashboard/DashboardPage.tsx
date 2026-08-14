import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { Users, Mail, Zap, CalendarClock } from "lucide-react";
import { fetchDashboard } from "./dashboardApi.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Button } from "../../components/ui/Button.js";
import { CAMPAIGN_STATUS_TONE } from "../campaigns/statusTone.js";
import { RecentActivityCard } from "../audit/RecentActivityCard.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { cn } from "../../lib/cn.js";

const STAT_CARDS: {
  key: "totalContacts" | "emailsSent" | "activeCampaigns" | "scheduledCampaigns";
  label: string;
  icon: typeof Users;
  iconClass: string;
}[] = [
  { key: "totalContacts", label: "Total contacts", icon: Users, iconClass: "bg-brand-500/10 text-brand-600 dark:text-brand-300" },
  { key: "emailsSent", label: "Emails sent", icon: Mail, iconClass: "bg-lime-500/15 text-lime-600 dark:text-lime-400" },
  { key: "activeCampaigns", label: "Active campaigns", icon: Zap, iconClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  {
    key: "scheduledCampaigns",
    label: "Scheduled",
    icon: CalendarClock,
    iconClass: "bg-ink-500/10 text-ink-600 dark:bg-ink-300/10 dark:text-ink-300",
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

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  const engagementData = ENGAGEMENT_RINGS.map((r) => ({ name: r.label, value: data[r.key], fill: r.color }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">Believe it — here's how outreach is going.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-4 lg:col-span-1 lg:grid-rows-2">
          {STAT_CARDS.map(({ key, label, icon: Icon, iconClass }, i) => (
            <motion.div key={key} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
              <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                <CardBody>
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconClass)}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="mt-3 text-sm text-ink-500 dark:text-ink-400">{label}</div>
                  <div className="mt-0.5 text-2xl font-semibold tabular-nums text-ink-900 dark:text-white">
                    <AnimatedNumber value={data[key]} />
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants} className="lg:col-span-2">
          <Card className="h-full transition-shadow duration-200 hover:shadow-lift">
            <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="mx-auto h-40 w-40 shrink-0 sm:mx-0">
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
              </div>
              <div className="flex-1 space-y-3">
                <h2 className="font-medium text-ink-900 dark:text-white">Engagement</h2>
                {ENGAGEMENT_RINGS.map((r) => (
                  <div key={r.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                      {r.label}
                    </span>
                    <span className="font-medium tabular-nums text-ink-900 dark:text-white">{data[r.key]}%</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
        <Card>
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
                title="No campaigns yet."
                description="Your first campaign could be the beginning of your next opportunity."
                action={
                  <Link to="/app/campaigns">
                    <Button size="sm">Create campaign</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {data.recentCampaigns.map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="flex items-center justify-between rounded-lg py-3 px-2 -mx-2 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/60"
                  >
                    <div>
                      <Link to={`/app/campaigns/${c.id}`} className="font-medium text-ink-900 hover:underline dark:text-white">
                        {c.name}
                      </Link>
                      <div className="text-xs text-ink-400">{c.subject}</div>
                    </div>
                    <Badge tone={CAMPAIGN_STATUS_TONE[c.status]}>{c.status}</Badge>
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

function DashboardSkeleton() {
  const pulse = "animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800";
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className={`h-7 w-40 ${pulse}`} />
        <div className={`h-4 w-64 ${pulse}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-4 lg:col-span-1 lg:grid-rows-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardBody className="space-y-2">
                <div className={`h-4 w-20 ${pulse}`} />
                <div className={`h-7 w-16 ${pulse}`} />
              </CardBody>
            </Card>
          ))}
        </div>
        <Card className="lg:col-span-2">
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
      </div>
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
