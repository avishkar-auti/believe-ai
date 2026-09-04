import {
  BarChart3,
  Briefcase,
  Code2,
  GraduationCap,
  Laptop,
  MessageCircle,
  MessagesSquare,
  NotebookPen,
  Palette,
  Rocket,
  Send,
  Target,
  Users,
  type LucideIcon,
  BookOpen,
  LayoutTemplate,
  Mail,
} from "lucide-react";

export interface PersonaFeature {
  label: string;
  to: string;
  Icon: LucideIcon;
}

export interface PersonaData {
  key: string;
  label: string;
  Icon: LucideIcon;
  headline: string;
  capabilities: string[];
  features: PersonaFeature[];
}

// Every feature links to a real, confirmed route (same set as landingNavigation.ts).
// "Analytics" is never its own chip — /app/analytics has no distinct content
// of its own (same reasoning as the navbar), so it's mentioned only in prose,
// where it's true: Campaigns already shows performance inline.
export const PERSONAS: PersonaData[] = [
  {
    key: "students",
    label: "Students",
    Icon: GraduationCap,
    headline: "Everything you need to start your career journey.",
    capabilities: [
      "Build core skills with AI-guided practice",
      "Follow a personalized learning roadmap",
      "See how you match with real roles",
      "Learn alongside a community of peers",
    ],
    features: [
      { label: "Learning Roadmap", to: "/app/roadmaps", Icon: BookOpen },
      { label: "AI Practice Lab", to: "/app/practice", Icon: Code2 },
      { label: "Career Fit", to: "/app/career-fit", Icon: Target },
      { label: "Community", to: "/app/community", Icon: MessageCircle },
    ],
  },
  {
    key: "jobSeekers",
    label: "Job Seekers",
    Icon: Briefcase,
    headline: "Everything job seekers need to land their next role.",
    capabilities: [
      "Discover high-fit opportunities",
      "Build an ATS-friendly resume",
      "Practice interviews with AI",
      "Track applications and responses",
      "Get hired faster",
    ],
    features: [
      { label: "Job Board", to: "/app/jobs", Icon: Briefcase },
      { label: "Career Fit", to: "/app/career-fit", Icon: Target },
      { label: "Interview Prep", to: "/app/interview-prep", Icon: MessagesSquare },
      { label: "Campaigns", to: "/app/campaigns", Icon: Send },
    ],
  },
  {
    key: "developers",
    label: "Developers",
    Icon: Code2,
    headline: "Sharpen your skills and show what you can build.",
    capabilities: [
      "Practice with AI-powered coding challenges",
      "Follow a roadmap built around your stack",
      "Rehearse technical interviews",
      "Find roles that fit what you build",
      "Showcase projects in Design Studio",
    ],
    features: [
      { label: "AI Practice Lab", to: "/app/practice", Icon: Code2 },
      { label: "Learning Roadmap", to: "/app/roadmaps", Icon: BookOpen },
      { label: "Interview Prep", to: "/app/interview-prep", Icon: MessagesSquare },
      { label: "Job Board", to: "/app/jobs", Icon: Briefcase },
      { label: "Design Studio", to: "/app/design-studio", Icon: LayoutTemplate },
    ],
  },
  {
    key: "recruiters",
    label: "Recruiters",
    Icon: Users,
    headline: "Reach the right candidates, faster.",
    capabilities: [
      "Organize candidate contacts in one place",
      "Write outreach with AI-assisted templates",
      "Run and track outreach campaigns",
      "See what's working with built-in analytics",
    ],
    features: [
      { label: "Contacts", to: "/app/contacts", Icon: Users },
      { label: "Templates", to: "/app/templates", Icon: Mail },
      { label: "Campaigns", to: "/app/campaigns", Icon: Send },
      { label: "Email Tracking", to: "/app/email-tracking", Icon: BarChart3 },
    ],
  },
  {
    key: "founders",
    label: "Founders",
    Icon: Rocket,
    headline: "Everything you need to build and grow.",
    capabilities: [
      "Reach investors and partners with outreach",
      "Keep research and notes organized",
      "Design pitch decks and product screens",
      "Track what's working with analytics",
    ],
    features: [
      { label: "Campaigns", to: "/app/campaigns", Icon: Send },
      { label: "Contacts", to: "/app/contacts", Icon: Users },
      { label: "Believe Notes", to: "/app/notes", Icon: NotebookPen },
      { label: "Design Studio", to: "/app/design-studio", Icon: LayoutTemplate },
    ],
  },
  {
    key: "freelancers",
    label: "Freelancers",
    Icon: Laptop,
    headline: "Win clients and manage the work in one place.",
    capabilities: [
      "Reach new clients with outreach",
      "Build a portfolio in Design Studio",
      "Keep client research in Believe Notes",
      "Track replies and follow-ups",
    ],
    features: [
      { label: "Campaigns", to: "/app/campaigns", Icon: Send },
      { label: "Design Studio", to: "/app/design-studio", Icon: LayoutTemplate },
      { label: "Believe Notes", to: "/app/notes", Icon: NotebookPen },
      { label: "Email Tracking", to: "/app/email-tracking", Icon: BarChart3 },
    ],
  },
  {
    key: "creators",
    label: "Creators",
    Icon: Palette,
    headline: "Create, share, and grow what you're building.",
    capabilities: [
      "Design visuals and layouts in Design Studio",
      "Capture ideas in Believe Notes",
      "Connect through community discussions",
      "Reach collaborators with outreach",
    ],
    features: [
      { label: "Design Studio", to: "/app/design-studio", Icon: LayoutTemplate },
      { label: "Believe Notes", to: "/app/notes", Icon: NotebookPen },
      { label: "Community", to: "/app/community", Icon: MessageCircle },
      { label: "Campaigns", to: "/app/campaigns", Icon: Send },
    ],
  },
];

export const DEFAULT_PERSONA_INDEX = PERSONAS.findIndex((p) => p.key === "jobSeekers");
