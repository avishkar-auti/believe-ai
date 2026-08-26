import type { DesignProject } from "@believe-ai/shared";

export interface ProjectGroup {
  label: string;
  projects: DesignProject[];
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Buckets an already `-updatedAt`-sorted project list into date sections —
 * plain Date math, no library, matching this app's existing timeAgo()-style
 * relative-date conventions elsewhere. Empty buckets are omitted. */
export function groupProjectsByDate(projects: DesignProject[]): ProjectGroup[] {
  const today = startOfDay(new Date());
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;

  const todayGroup: ProjectGroup = { label: "Today", projects: [] };
  const yesterdayGroup: ProjectGroup = { label: "Yesterday", projects: [] };
  const lastWeekGroup: ProjectGroup = { label: "Last 7 days", projects: [] };
  const olderGroup: ProjectGroup = { label: "Older", projects: [] };

  for (const project of projects) {
    const day = startOfDay(new Date(project.updatedAt));
    if (day >= today) todayGroup.projects.push(project);
    else if (day >= yesterday) yesterdayGroup.projects.push(project);
    else if (day >= weekAgo) lastWeekGroup.projects.push(project);
    else olderGroup.projects.push(project);
  }

  return [todayGroup, yesterdayGroup, lastWeekGroup, olderGroup].filter((b) => b.projects.length > 0);
}
