import { Briefcase, Handshake, Megaphone, Share2, Sparkles, TrendingUp, Users, type LucideIcon } from "lucide-react";

export interface GoalOption {
  value: string;
  label: string;
  description: string;
  Icon: LucideIcon;
}

// `value` feeds directly into the profile sentence "I'm using believe.ai to
// {value}." in the finish mutation — keep it lowercase and grammatical.
export const GOALS: GoalOption[] = [
  { value: "find a job", label: "Find a job", description: "Discover roles and land your next opportunity.", Icon: Briefcase },
  { value: "generate leads", label: "Generate leads", description: "Find and engage potential leads.", Icon: TrendingUp },
  {
    value: "recruit candidates",
    label: "Recruit candidates",
    description: "Source and connect with top talent.",
    Icon: Users,
  },
  { value: "find clients", label: "Find clients", description: "Attract and win new clients.", Icon: Handshake },
  { value: "build my network", label: "Network", description: "Grow your network and relationships.", Icon: Share2 },
  {
    value: "promote my business",
    label: "Promote my business",
    description: "Increase visibility and grow your brand.",
    Icon: Megaphone,
  },
  {
    value: "reach the right people",
    label: "Something else",
    description: "Tell us more about your unique goal.",
    Icon: Sparkles,
  },
];

export const STEP_LABELS = ["Welcome", "About you", "Your goal", "You're set"];

export const FOCUS_AREAS = ["Career", "Outreach", "Learning"];
