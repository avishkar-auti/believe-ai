import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  ExternalLink,
  FileText,
  GraduationCap,
  MailOpen,
  Sparkles,
  Users,
} from "lucide-react";
import { ModernCard, ModernSectionTitle } from "../../components/modern/ModernCard.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { resolveProfileImageUrl } from "../../lib/profileImage.js";
import { MODERN_MOTION, fadeReveal, staggerReveal } from "../../lib/modernMotion.js";
import { cn } from "../../lib/cn.js";
import { fetchDashboard } from "./dashboardApi.js";
import { fetchCareerFits } from "../career-fit/careerFitApi.js";
import { fetchPracticeProgress } from "../practice-lab/practiceApi.js";
import { fetchAuditLogs } from "../audit/auditApi.js";
import { ACTION_LABELS, describe, timeAgo } from "../audit/activityLabels.js";
import { fetchSkills } from "../profile/api/skillsApi.js";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const COPILOT_ACTIONS = [
  { to: "/app/resume", label: "Improve Resume", Icon: FileText },
  { to: "/app/jobs", label: "Find Jobs", Icon: Briefcase },
  { to: "/app/interview-prep", label: "Prepare Interview", Icon: GraduationCap },
];

/** One stat tile. `to` makes the whole card a link; `empty` renders the
 * "nothing to show yet" affordance instead of a fabricated zero. */
function StatCard({
  label,
  value,
  detail,
  Icon,
  accent,
  to,
}: {
  label: string;
  value: string;
  detail: string;
  Icon: typeof Users;
  accent: string;
  to: string;
}) {
  return (
    <ModernCard reveal interactive className="group p-4">
      <Link to={to} className="block focus-visible:outline-none">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)]", accent)}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-3 text-[11.5px] font-medium uppercase tracking-[0.06em] text-fg-subtle">{label}</p>
        <p className="mt-0.5 text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-fg">{value}</p>
        <p className="mt-1.5 text-[11.5px] text-fg-muted">{detail}</p>
      </Link>
    </ModernCard>
  );
}

export function ModernDashboard() {
  const { data: user } = useCurrentUser();
  const { data: stats } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const { data: careerFits } = useQuery({ queryKey: ["careerFits"], queryFn: fetchCareerFits });
  const { data: practice } = useQuery({ queryKey: ["practiceProgress"], queryFn: fetchPracticeProgress });
  const { data: activity } = useQuery({ queryKey: ["auditLogs"], queryFn: () => fetchAuditLogs(8) });
  const { data: skills } = useQuery({ queryKey: ["skills"], queryFn: fetchSkills });

  const latestFit = careerFits?.items[0];
  const featuredSkills = (skills ?? []).filter((s) => s.featured).map((s) => s.name);
  const firstName = (user?.name ?? "").split(/\s+/)[0];

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerReveal} className="space-y-6">
      {/* Editorial greeting rather than a dashboard title bar. */}
      <motion.div variants={fadeReveal}>
        <p className="text-[13px] text-fg-muted">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="mt-1.5 font-display text-[34px] leading-[1.05] tracking-[-0.035em] text-fg sm:text-[42px]">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-fg-muted">
          Everything you need for your career journey, in one place.
        </p>
      </motion.div>

      {/* AI Career Copilot hero */}
      <ModernCard reveal spotlight className="group p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgb(var(--accent) / 0.28), transparent 68%)" }}
        />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
            <Sparkles className="h-3 w-3" />
            AI Career Copilot
          </span>
          <h2 className="mt-4 font-display text-[28px] leading-[1.08] tracking-[-0.03em] text-fg sm:text-[34px]">
            Your career, with a co-pilot.
          </h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-fg-muted">
            Personalised guidance, smarter tools and real opportunities — all in one place.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {COPILOT_ACTIONS.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className="group/btn inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] font-medium text-fg transition-all duration-150 hover:-translate-y-px hover:border-line-strong hover:bg-surface-3 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Icon className="h-4 w-4 text-fg-subtle" />
                {label}
                <ArrowRight className="h-3.5 w-3.5 text-fg-subtle transition-transform duration-150 group-hover/btn:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </ModernCard>

      {/* Bento metrics — every tile is backed by a real, already-computed
          number. Anything the product doesn't actually measure (job
          applications, GitHub activity) is deliberately absent rather than
          invented. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Career score"
          value={latestFit ? String(latestFit.fitScore) : "—"}
          detail={latestFit ? latestFit.targetRole ?? "Latest assessment" : "Run your first assessment"}
          Icon={BadgeCheck}
          accent="bg-accent/10 text-accent"
          to="/app/career-fit"
        />
        <StatCard
          label="Contacts"
          value={String(stats?.totalContacts ?? 0)}
          detail={`${stats?.activeCampaigns ?? 0} active campaign${stats?.activeCampaigns === 1 ? "" : "s"}`}
          Icon={Users}
          accent="bg-informative/10 text-informative"
          to="/app/contacts"
        />
        <StatCard
          label="Open rate"
          value={`${stats?.openRate ?? 0}%`}
          detail={`${stats?.emailsSent ?? 0} email${stats?.emailsSent === 1 ? "" : "s"} sent`}
          Icon={MailOpen}
          accent="bg-positive/10 text-positive"
          to="/app/analytics"
        />
        <StatCard
          label="Practice"
          value={String(practice?.challengesSolved ?? 0)}
          detail={`${practice?.totalSubmissions ?? 0} submission${practice?.totalSubmissions === 1 ? "" : "s"}`}
          Icon={GraduationCap}
          accent="bg-caution/10 text-caution"
          to="/app/practice"
        />
      </div>

      {/* Activity + profile preview */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.55fr_1fr]">
        <ModernCard reveal className="p-5">
          <ModernSectionTitle
            action={
              <Link
                to="/app/campaigns"
                className="group inline-flex items-center gap-1 text-[12px] font-medium text-fg-muted transition-colors hover:text-fg"
              >
                View all
                <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            }
          >
            Recent activity
          </ModernSectionTitle>

          {!activity || activity.items.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-fg-muted">Your account activity will show up here as you work.</p>
          ) : (
            <ul className="-mx-2">
              {activity.items.map((log) => {
                const detail = describe(log);
                return (
                  <li
                    key={log.id}
                    className="group flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-2.5 transition-colors hover:bg-fg/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-fg">{ACTION_LABELS[log.action] ?? log.action}</p>
                      {detail && <p className="truncate text-[12px] text-fg-subtle">{detail}</p>}
                    </div>
                    <span className="shrink-0 text-[11.5px] tabular-nums text-fg-subtle">{timeAgo(log.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </ModernCard>

        <ModernCard reveal className="p-5">
          <ModernSectionTitle>Your public profile</ModernSectionTitle>

          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent to-accent-hover text-sm font-semibold text-accent-fg">
              {resolveProfileImageUrl(user?.avatar) ? (
                <img src={resolveProfileImageUrl(user?.avatar) ?? ""} alt={user?.name ?? ""} className="h-full w-full object-cover" />
              ) : (
                (user?.name ?? "?").slice(0, 1).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate text-[14px] font-semibold text-fg">
                {user?.name ?? "—"}
                {user?.publicProfileEnabled && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-positive/10 px-1.5 py-0.5 text-[10px] font-medium text-positive">
                    <span className="h-1 w-1 rounded-full bg-positive" />
                    Live
                  </span>
                )}
              </p>
              {user?.headline && <p className="truncate text-[12px] text-fg-muted">{user.headline}</p>}
              {user?.location && <p className="truncate text-[11.5px] text-fg-subtle">{user.location}</p>}
            </div>
          </div>

          {user?.bio && <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-fg-muted">{user.bio}</p>}

          {featuredSkills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {featuredSkills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="rounded-[var(--radius-xs)] border border-line bg-fg/[0.04] px-2 py-1 text-[11px] font-medium text-fg-muted"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          <Link
            to={user?.username && user.publicProfileEnabled ? `/u/${user.username}` : "/app/profile"}
            target={user?.username && user.publicProfileEnabled ? "_blank" : undefined}
            rel={user?.username && user.publicProfileEnabled ? "noreferrer noopener" : undefined}
            className="group mt-4 flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-line bg-surface-2 py-2.5 text-[13px] font-medium text-fg transition-all duration-150 hover:-translate-y-px hover:border-line-strong hover:bg-surface-3 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {user?.username && user.publicProfileEnabled ? "View public profile" : "Set up your profile"}
            {user?.username && user.publicProfileEnabled ? (
              <ExternalLink className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-px group-hover:-translate-y-px" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
          </Link>
        </ModernCard>
      </div>

      {/* Recent campaigns — the one table-shaped thing worth keeping. */}
      {stats && stats.recentCampaigns.length > 0 && (
        <ModernCard reveal className="p-5">
          <ModernSectionTitle
            action={
              <Link
                to="/app/campaigns"
                className="group inline-flex items-center gap-1 text-[12px] font-medium text-fg-muted transition-colors hover:text-fg"
              >
                All campaigns
                <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            }
          >
            Recent campaigns
          </ModernSectionTitle>

          <ul className="-mx-2">
            {stats.recentCampaigns.map((campaign) => (
              <li key={campaign.id}>
                <Link
                  to={`/app/campaigns/${campaign.id}`}
                  className="group flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-2.5 transition-colors hover:bg-fg/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-fg">{campaign.name}</p>
                    <p className="truncate text-[12px] text-fg-subtle">{campaign.subject}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[11.5px] tabular-nums text-fg-subtle">
                      {campaign.audienceContactIds.length} recipient{campaign.audienceContactIds.length === 1 ? "" : "s"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-fg-subtle transition-transform duration-150 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </ModernCard>
      )}
    </motion.div>
  );
}

/** Skeleton mirroring the real layout's geometry so nothing jumps when data
 * lands. Uses the Modern surface tokens rather than a white flash. */
export function ModernDashboardSkeleton() {
  const block = "animate-pulse rounded-[var(--radius-lg)] border border-line bg-surface";
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <div className="h-3 w-40 animate-pulse rounded-full bg-surface-2" />
        <div className="h-10 w-72 animate-pulse rounded-lg bg-surface-2" />
      </div>
      <div className={cn(block, "h-56")} style={{ transitionDuration: `${MODERN_MOTION.duration.normal}s` }} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn(block, "h-32")} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.55fr_1fr]">
        <div className={cn(block, "h-72")} />
        <div className={cn(block, "h-72")} />
      </div>
    </div>
  );
}
