export interface MetricCardData {
  label: string;
  value: number;
  suffix?: string;
}

// "Applications" and "Jobs saved" describe real user actions (applying via a
// job's apply link, saving a job) even though this preview's numbers are
// illustrative — same convention as the rest of the page.
export const METRIC_CARDS: MetricCardData[] = [
  { label: "Jobs saved", value: 24 },
  { label: "Applications", value: 48 },
  { label: "Reply rate", value: 36, suffix: "%" },
];

export interface ActivitySegment {
  label: string;
  percent: number;
  textClass: string;
  dotClass: string;
}

// A breakdown by real product area (not a marketing "traffic source" claim —
// believe.ai doesn't track referral sources, so this shows where the
// workspace's own activity happens instead).
// textClass/dotClass are spelled out in full (not built with string
// concatenation) so Tailwind's content scanner can find both utilities.
export const ACTIVITY_SEGMENTS: ActivitySegment[] = [
  { label: "Job Board", percent: 38, textClass: "text-accent", dotClass: "bg-accent" },
  { label: "Practice", percent: 27, textClass: "text-informative", dotClass: "bg-informative" },
  { label: "Outreach", percent: 22, textClass: "text-positive", dotClass: "bg-positive" },
  { label: "Notes", percent: 13, textClass: "text-caution", dotClass: "bg-caution" },
];
