import { BookOpen, Compass, Send, TrendingUp, type LucideIcon } from "lucide-react";

export interface JourneyStepData {
  n: string;
  title: string;
  body: string;
  Icon: LucideIcon;
}

export const JOURNEY_STEPS: JourneyStepData[] = [
  { n: "01", title: "Discover", body: "Explore roles, insights, and opportunities that fit you best.", Icon: Compass },
  { n: "02", title: "Prepare", body: "Learn, build skills, and practice with AI-powered tools.", Icon: BookOpen },
  { n: "03", title: "Reach Out", body: "Connect with the right people using personalized outreach.", Icon: Send },
  { n: "04", title: "Grow", body: "Track progress, get feedback, and move your goals forward.", Icon: TrendingUp },
];
