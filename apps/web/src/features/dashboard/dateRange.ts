export interface DateRange {
  from: Date;
  to: Date;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function formatRange(from: Date, to: Date): string {
  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();
  const fromFmt = from.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const toFmt = to.toLocaleDateString(undefined, sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" });
  return `${fromFmt} – ${toFmt}, ${to.getFullYear()}`;
}

export function buildMonthGrid(viewMonth: Date): Date[] {
  const first = startOfMonth(viewMonth);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function defaultWeekRange(now: Date): DateRange {
  return { from: startOfWeek(now), to: addDays(startOfWeek(now), 6) };
}

export const RANGE_PRESETS: { label: string; range: (now: Date) => DateRange }[] = [
  { label: "This week", range: (now) => ({ from: startOfWeek(now), to: addDays(startOfWeek(now), 6) }) },
  { label: "Last 7 days", range: (now) => ({ from: addDays(startOfDay(now), -6), to: startOfDay(now) }) },
  { label: "Last 30 days", range: (now) => ({ from: addDays(startOfDay(now), -29), to: startOfDay(now) }) },
  { label: "This month", range: (now) => ({ from: startOfMonth(now), to: startOfDay(now) }) },
];
