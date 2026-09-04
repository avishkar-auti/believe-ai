import type { NoteSummary } from "@believe-ai/shared";

export interface NoteDateGroup {
  label: string;
  notes: NoteSummary[];
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Buckets an already `-updatedAt`-sorted note list into date sections — same
 * plain Date-math approach as design-studio's groupProjectsByDate. Empty
 * buckets are omitted. */
export function groupNotesByDate(notes: NoteSummary[]): NoteDateGroup[] {
  const today = startOfDay(new Date());
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;

  const todayGroup: NoteDateGroup = { label: "Today", notes: [] };
  const yesterdayGroup: NoteDateGroup = { label: "Yesterday", notes: [] };
  const weekGroup: NoteDateGroup = { label: "Earlier this week", notes: [] };
  const olderGroup: NoteDateGroup = { label: "Older", notes: [] };

  for (const note of notes) {
    const day = startOfDay(new Date(note.updatedAt));
    if (day >= today) todayGroup.notes.push(note);
    else if (day >= yesterday) yesterdayGroup.notes.push(note);
    else if (day >= weekAgo) weekGroup.notes.push(note);
    else olderGroup.notes.push(note);
  }

  return [todayGroup, yesterdayGroup, weekGroup, olderGroup].filter((g) => g.notes.length > 0);
}
