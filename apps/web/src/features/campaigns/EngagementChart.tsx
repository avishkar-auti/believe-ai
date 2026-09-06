import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EngagementTimeseriesPoint } from "@believe-ai/shared";

const SERIES: { key: keyof EngagementTimeseriesPoint; label: string; color: string }[] = [
  { key: "opened", label: "Opens", color: "#8b5cf6" },
  { key: "clicked", label: "Clicks", color: "#6366f1" },
  { key: "replied", label: "Replies", color: "#22c55e" },
];

/** Grouped by calendar date (the real granularity EmailEvent timestamps
 * support) rather than time-of-day — a real multi-day campaign's actual
 * send/open/click/reply pattern, not a synthetic hourly demo view. */
export function EngagementChart({ data }: { data: EngagementTimeseriesPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-500 dark:text-ink-400">Engagement will appear here once emails start going out.</p>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-ink-800" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-ink-400" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-ink-400" />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {SERIES.map((series) => (
            <Bar key={series.key} dataKey={series.key} name={series.label} fill={series.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
