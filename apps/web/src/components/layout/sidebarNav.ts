import {
  BookOpen,
  Briefcase,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CreditCard,
  FileText,
  GraduationCap,
  House,
  LayoutTemplate,
  Mail,
  NotebookPen,
  Plug,
  Send,
  Settings,
  Users,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavLeaf {
  to: string;
  label: string;
  /** Top-level Workspace/Account items always render this. Career Hub
   * children never do (brief: no full-size icons on children, just a dot) —
   * omitted there rather than set to a meaningless placeholder. */
  icon?: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavLeaf[];
}

export interface NavSection {
  heading: string;
  items?: NavLeaf[];
  groups?: NavGroup[];
}

/** Single source of truth for the sidebar's navigation — rendered as-is by
 * the full, compact, and mobile presentations (see Sidebar.tsx). Every `to`
 * is a real route registered in app/router/index.tsx; nothing here is
 * invented. */
export const NAV: NavSection[] = [
  {
    heading: "Workspace",
    items: [
      { to: "/app", label: "Home", icon: House, end: true },
      { to: "/app/campaigns", label: "Campaigns", icon: Send },
      { to: "/app/contacts", label: "Contacts", icon: Users },
      { to: "/app/templates", label: "Templates", icon: FileText },
      { to: "/app/ai-writer", label: "Believe AI Writer", icon: WandSparkles },
      { to: "/app/analytics", label: "Analytics", icon: ChartNoAxesCombined },
      { to: "/app/email-tracking", label: "Email Tracking", icon: Mail },
      { to: "/app/notes", label: "Believe Notes", icon: NotebookPen },
      { to: "/app/design-studio", label: "Design Studio", icon: LayoutTemplate },
    ],
  },
  {
    heading: "Career Hub",
    groups: [
      {
        label: "Resume & Career",
        icon: BriefcaseBusiness,
        items: [
          { to: "/app/resume", label: "Ask My Resume" },
          { to: "/app/career-fit", label: "Career Fit" },
          { to: "/app/roadmaps", label: "Learning Roadmap" },
        ],
      },
      {
        label: "Practice",
        icon: GraduationCap,
        items: [
          { to: "/app/practice", label: "AI Practice Lab" },
          { to: "/app/interview-prep", label: "Interview Prep" },
          { to: "/app/interview-room", label: "Practice Room" },
        ],
      },
      {
        label: "Opportunities",
        icon: Briefcase,
        items: [
          { to: "/app/jobs", label: "Job Board" },
          { to: "/app/job-outreach", label: "Job Intelligence" },
          { to: "/app/community", label: "Community" },
          { to: "/app/news", label: "News" },
        ],
      },
    ],
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
