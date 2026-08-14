import { Card, CardBody } from "../../components/ui/Card.js";

interface GuideItem {
  title: string;
  description: string;
}

interface GuideSection {
  heading: string;
  items: GuideItem[];
}

const SECTIONS: GuideSection[] = [
  {
    heading: "Outreach",
    items: [
      {
        title: "Contacts",
        description: "Add recipients one at a time or import a CSV. Tag them to segment your audience for campaigns.",
      },
      {
        title: "Templates",
        description: "Write reusable email templates with {{firstName}}-style variables that get filled in per recipient.",
      },
      {
        title: "Believe AI Writer",
        description: "Generate or improve email copy with AI, grounded in your Believe Profile from Settings.",
      },
      {
        title: "Campaigns",
        description:
          "Create a campaign in five steps: details, recipients, content, follow-ups, then review and launch. Follow-ups send automatically on a schedule and stop early if a recipient replies.",
      },
      {
        title: "Analytics & Email Tracking",
        description:
          "Analytics shows your overall send/open/reply rates. Email Tracking lists every individual send across all campaigns with its delivery status.",
      },
    ],
  },
  {
    heading: "Career Tools",
    items: [
      {
        title: "Ask My Resume",
        description: "Upload your resume once, then ask it questions — answers are grounded in what you actually wrote.",
      },
      {
        title: "Career Fit",
        description: "Paste a job description to get an AI assessment of how well your resume matches, and what's missing.",
      },
      {
        title: "Learning Roadmap",
        description: "Generate a study plan toward a target role, broken into stages with concrete resources.",
      },
      {
        title: "Interview Prep",
        description:
          "Generate practice questions for a target role, chat with an AI interview coach for feedback, and run code in the built-in sandbox.",
      },
      {
        title: "Job Board",
        description:
          "Browse internally posted jobs plus aggregated external listings. Turn on Recruiter mode in Settings to post and manage your own listings.",
      },
      {
        title: "Community",
        description: "Ask questions and share advice with other job seekers in open discussion threads.",
      },
      {
        title: "Practice Room",
        description: "Schedule a live video mock interview. The room opens 10 minutes early and sends a calendar invite automatically.",
      },
    ],
  },
  {
    heading: "Account",
    items: [
      {
        title: "Integrations",
        description: "Connect Gmail or Outlook so campaigns send from your own address instead of a shared one.",
      },
      {
        title: "Settings",
        description:
          "Set your sender profile, fill in your Believe Profile (used to personalize AI-written emails), toggle Recruiter mode, and check your plan usage.",
      },
      {
        title: "Pricing",
        description: "Compare plan limits for contacts, campaigns, daily sends, and AI generations.",
      },
    ],
  },
];

export function HowToUsePage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">How To Use</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">A quick tour of what each part of believe.ai does.</p>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.heading} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">{section.heading}</h2>
          <Card>
            <CardBody className="divide-y divide-ink-100 p-0 dark:divide-ink-800">
              {section.items.map((item) => (
                <div key={item.title} className="px-6 py-4">
                  <h3 className="font-medium text-ink-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{item.description}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      ))}
    </div>
  );
}
