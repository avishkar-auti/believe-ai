import { NavLink, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  FileText,
  Send,
  Sparkles,
  MessageCircle,
  Target,
  Map,
  GraduationCap,
  Briefcase,
  Users2,
  Video,
  BarChart3,
  MailCheck,
  Plug,
  Settings,
  CreditCard,
  BookOpen,
  FileSearch,
  Newspaper,
  NotebookPen,
  X,
  Search,
  ChevronRight,
  Sparkle,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "../../lib/cn.js";
import { FeedbackWidget } from "../../features/feedback/FeedbackWidget.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { fetchUsage } from "../../features/settings/usageApi.js";
import { OPEN_COMMAND_PALETTE_EVENT } from "../../features/search/CommandPalette.js";

const NAV_SECTIONS = [
  {
    heading: "Outreach",
    items: [
      { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/app/campaigns", label: "Campaigns", icon: Megaphone },
      { to: "/app/contacts", label: "Contacts", icon: Users },
      { to: "/app/templates", label: "Templates", icon: FileText },
      { to: "/app/ai-writer", label: "Believe AI Writer", icon: Sparkles },
      { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/app/email-tracking", label: "Email Tracking", icon: MailCheck },
    ],
  },
  {
    heading: "Career Tools",
    items: [
      { to: "/app/notes", label: "Believe Notes", icon: NotebookPen },
      { to: "/app/design-studio", label: "Design Studio", icon: LayoutTemplate },
      { to: "/app/resume", label: "Ask My Resume", icon: MessageCircle },
      { to: "/app/career-fit", label: "Career Fit", icon: Target },
      { to: "/app/roadmaps", label: "Learning Roadmap", icon: Map },
      { to: "/app/interview-prep", label: "Interview Prep", icon: GraduationCap },
      { to: "/app/jobs", label: "Job Board", icon: Briefcase },
      { to: "/app/community", label: "Community", icon: Users2 },
      { to: "/app/interview-room", label: "Practice Room", icon: Video },
      { to: "/app/news", label: "News", icon: Newspaper },
    ],
  },
  {
    heading: "Job Outreach",
    items: [{ to: "/app/job-outreach", label: "Job Intelligence", icon: FileSearch }],
  },
  {
    heading: "Account",
    items: [
      { to: "/app/integrations", label: "Integrations", icon: Plug },
      { to: "/app/settings", label: "Settings", icon: Settings },
      { to: "/app/pricing", label: "Pricing", icon: CreditCard },
      { to: "/app/how-to-use", label: "How To Use", icon: BookOpen },
    ],
  },
];

function BrandMark() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 px-4">
      <motion.span
        whileHover={{ rotate: -8, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500"
      >
        <Send className="h-3.5 w-3.5 text-white" />
      </motion.span>
      <span className="text-base font-semibold tracking-tight text-ink-900 dark:text-white">believe.ai</span>
    </div>
  );
}

function SearchTrigger() {
  return (
    <div className="shrink-0 px-3 pb-2">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT))}
        className="flex w-full items-center gap-2 rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-400 transition-colors hover:border-ink-200 hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-900/60 dark:hover:bg-ink-800"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        Search…
        <kbd className="ml-auto rounded-md bg-white px-1.5 py-0.5 font-sans text-[10px] text-ink-400 dark:bg-ink-800">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}

function SidebarNav({ onNavigate, animateIn }: { onNavigate?: () => void; animateIn: boolean }) {
  return (
    <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-2">
      {NAV_SECTIONS.map((section, sectionIndex) => (
        <motion.div
          key={section.heading}
          className="space-y-1"
          initial={animateIn ? { opacity: 0, x: -8 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: animateIn ? sectionIndex * 0.05 : 0, ease: "easeOut" }}
        >
          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
            {section.heading}
          </p>
          {section.items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className="group relative flex items-center gap-3 rounded-pill px-4 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-pill bg-gradient-to-r from-brand-500 to-brand-600 shadow-[0_2px_10px_-2px_rgba(67,83,255,0.55)]"
                      transition={{ type: "spring", stiffness: 500, damping: 42 }}
                    />
                  )}
                  {!isActive && (
                    <span className="absolute inset-0 rounded-pill bg-transparent transition-colors duration-150 group-hover:bg-ink-50 dark:group-hover:bg-ink-800" />
                  )}
                  <Icon
                    className={cn(
                      "relative z-10 h-4 w-4 shrink-0 transition-colors duration-150",
                      isActive
                        ? "text-white"
                        : "text-ink-500 group-hover:text-ink-900 dark:text-ink-300 dark:group-hover:text-white",
                    )}
                  />
                  <span
                    className={cn(
                      "relative z-10 min-w-0 flex-1 truncate transition-colors duration-150",
                      isActive
                        ? "text-white"
                        : "text-ink-500 group-hover:text-ink-900 dark:text-ink-300 dark:group-hover:text-white",
                    )}
                  >
                    {label}
                  </span>
                  <ChevronRight
                    className={cn(
                      "relative z-10 h-3.5 w-3.5 shrink-0 transition-all duration-150",
                      isActive
                        ? "text-white/70"
                        : "-translate-x-1 text-ink-300 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 dark:text-ink-600",
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </motion.div>
      ))}
    </nav>
  );
}

function UsageCard() {
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: fetchUsage });
  if (!usage) return null;

  const unlimited = usage.limits.maxContacts === -1;
  const pct = unlimited ? 0 : Math.min(100, Math.round((usage.contacts / usage.limits.maxContacts) * 100));

  return (
    <div className="rounded-2xl border border-ink-100 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-900/60">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-700 dark:text-ink-200">
        <Sparkle className="h-3.5 w-3.5 text-brand-500" /> {usage.plan} plan
      </div>
      {!unlimited && (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-brand-500"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-ink-400">
            {usage.contacts.toLocaleString()} / {usage.limits.maxContacts.toLocaleString()} contacts used
          </p>
        </>
      )}
      <Link
        to="/app/pricing"
        className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        {usage.plan === "FREE" ? "Upgrade plan" : "Manage plan"}
      </Link>
    </div>
  );
}

function ProfileRow() {
  const { data: user } = useCurrentUser();
  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <Link
      to="/app/settings"
      className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-600 dark:text-brand-300">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">
          {user?.name || "Your account"}
        </span>
        <span className="block truncate text-xs text-ink-400">{user?.email}</span>
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-300 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-ink-600" />
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="shrink-0 space-y-3 border-t border-ink-100 p-3 dark:border-ink-800">
      <UsageCard />
      <div className="flex items-center justify-between px-1">
        <FeedbackWidget />
      </div>
      <ProfileRow />
    </div>
  );
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: { mobileOpen?: boolean; onCloseMobile?: () => void }) {
  return (
    <>
      {/* Desktop — always mounted, hidden below md. A floating rounded card, inset from the shell edges.
          Sticky + viewport-height because the page itself scrolls as one document (Topbar stays put via
          sticky positioning too) — without a bounded height here, the nav's natural content height would
          stretch this card past the viewport and push the footer off-screen. */}
      <aside className="sticky top-0 hidden h-screen shrink-0 p-3 md:flex md:w-72">
        <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-800/40">
          <BrandMark />
          <SearchTrigger />
          <SidebarNav animateIn />
          <SidebarFooter />
        </div>
      </aside>

      {/* Mobile — a slide-in drawer, only ever rendered while open. */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40"
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              <div className="flex items-center justify-between pr-3">
                <BrandMark />
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close navigation"
                  className="flex h-9 w-9 items-center justify-center rounded-pill text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SearchTrigger />
              <SidebarNav onNavigate={onCloseMobile} animateIn={false} />
              <SidebarFooter />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
