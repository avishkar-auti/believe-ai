export interface LandingNavLink {
  label: string;
  to: string;
}

export interface LandingNavDropdown {
  label: string;
  links: LandingNavLink[];
}

export type LandingNavEntry = LandingNavLink | LandingNavDropdown;

export function isDropdown(entry: LandingNavEntry): entry is LandingNavDropdown {
  return "links" in entry;
}

/** Every `to` here is a real route confirmed in app/router/index.tsx — no
 * invented pages. "Analytics" is deliberately omitted from Outreach: that
 * route currently renders the Campaigns page verbatim (no distinct content
 * of its own yet), so linking it as though it were a separate destination
 * would be misleading. Resources only lists what's real (no Docs/Blog/Help
 * Center — none of those pages exist). */
export const LANDING_NAV: LandingNavEntry[] = [
  { label: "Product", to: "/#product" },
  {
    label: "Career",
    links: [
      { label: "Career Fit", to: "/app/career-fit" },
      { label: "Ask My Resume", to: "/app/resume" },
      { label: "Job Board", to: "/app/jobs" },
      { label: "Job Intelligence", to: "/app/job-outreach" },
      { label: "Learning Roadmap", to: "/app/roadmaps" },
    ],
  },
  {
    label: "Learn & Practice",
    links: [
      { label: "Interview Prep", to: "/app/interview-prep" },
      { label: "AI Practice Lab", to: "/app/practice" },
      { label: "Practice Room", to: "/app/interview-room" },
    ],
  },
  {
    label: "Outreach",
    links: [
      { label: "Campaigns", to: "/app/campaigns" },
      { label: "Contacts", to: "/app/contacts" },
      { label: "Templates", to: "/app/templates" },
      { label: "Believe AI Writer", to: "/app/ai-writer" },
      { label: "Email Tracking", to: "/app/email-tracking" },
    ],
  },
  {
    label: "Create",
    links: [
      { label: "Design Studio", to: "/app/design-studio" },
      { label: "Believe Notes", to: "/app/notes" },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Community", to: "/app/community" },
      { label: "News", to: "/app/news" },
    ],
  },
];
