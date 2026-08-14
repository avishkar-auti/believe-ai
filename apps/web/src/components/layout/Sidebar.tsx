import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { cn } from "../../lib/cn.js";
import { FeedbackWidget } from "../../features/feedback/FeedbackWidget.js";

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
      { to: "/app/resume", label: "Ask My Resume", icon: MessageCircle },
      { to: "/app/career-fit", label: "Career Fit", icon: Target },
      { to: "/app/roadmaps", label: "Learning Roadmap", icon: Map },
      { to: "/app/interview-prep", label: "Interview Prep", icon: GraduationCap },
      { to: "/app/jobs", label: "Job Board", icon: Briefcase },
      { to: "/app/community", label: "Community", icon: Users2 },
      { to: "/app/interview-room", label: "Practice Room", icon: Video },
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

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900 md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <motion.span
          whileHover={{ rotate: -8, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500"
        >
          <Send className="h-3.5 w-3.5 text-white" />
        </motion.span>
        <span className="text-base font-semibold tracking-tight text-ink-900 dark:text-white">believe.ai</span>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <motion.div
            key={section.heading}
            className="space-y-1"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: sectionIndex * 0.05, ease: "easeOut" }}
          >
            <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
              {section.heading}
            </p>
            {section.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="group relative flex items-center gap-3 rounded-pill px-4 py-2.5 text-sm font-medium"
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
                        "relative z-10 h-4 w-4 transition-colors duration-150",
                        isActive
                          ? "text-white"
                          : "text-ink-500 group-hover:text-ink-900 dark:text-ink-300 dark:group-hover:text-white",
                      )}
                    />
                    <span
                      className={cn(
                        "relative z-10 transition-colors duration-150",
                        isActive
                          ? "text-white"
                          : "text-ink-500 group-hover:text-ink-900 dark:text-ink-300 dark:group-hover:text-white",
                      )}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </motion.div>
        ))}
      </nav>
      <div className="space-y-2 border-t border-ink-100 px-5 py-4 text-xs text-ink-400 dark:border-ink-800">
        <p>Believe in your next opportunity.</p>
        <FeedbackWidget />
      </div>
    </aside>
  );
}
