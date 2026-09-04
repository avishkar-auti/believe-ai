import type { EmploymentType, ExperienceLevel, WorkMode } from "@believe-ai/shared";

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  fresher: "Fresher",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
};

export function formatSalary(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min.toLocaleString()} – ${max.toLocaleString()}`;
  if (min != null) return `${min.toLocaleString()}+`;
  return `Up to ${max!.toLocaleString()}`;
}

export function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function isFresh(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;
}
