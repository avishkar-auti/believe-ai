import { Briefcase, MessagesSquare, Send, Target, BookOpen, type LucideIcon } from "lucide-react";

export interface AuthPreviewCardData {
  key: string;
  label: string;
  stat: string;
  Icon: LucideIcon;
}

// Illustrative product-preview content — same convention used across the
// landing page (clearly a demo, not a claim about any specific account).
export const AUTH_PREVIEW_CARDS: AuthPreviewCardData[] = [
  { key: "careerFit", label: "Career Fit", stat: "92% match", Icon: Target },
  { key: "interviewPrep", label: "Interview Prep", stat: "8 questions ready", Icon: MessagesSquare },
  { key: "jobBoard", label: "Job Board", stat: "12 new matches", Icon: Briefcase },
  { key: "outreach", label: "AI Outreach", stat: "24 contacts ready", Icon: Send },
  { key: "roadmap", label: "Learning Roadmap", stat: "Next: Python → SQL", Icon: BookOpen },
];
