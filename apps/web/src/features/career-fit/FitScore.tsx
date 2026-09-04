import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { matchLabel } from "./fitScoreMath.js";

export function FitScore({ fitScore, strengthCount, gapCount }: { fitScore: number; strengthCount: number; gapCount: number }) {
  const percent = fitScore;
  const data = [{ name: "Fit", value: percent, fill: "rgb(var(--accent))" }];

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[4.5rem] w-[4.5rem] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="72%" outerRadius="100%" barSize={6} data={data} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={4} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-base font-semibold tabular-nums text-fg">{percent}%</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-h3 text-fg">{matchLabel(percent)}</p>
        <p className="mt-0.5 text-caption text-fg-subtle">
          {strengthCount} strength{strengthCount === 1 ? "" : "s"} identified, {gapCount} area{gapCount === 1 ? "" : "s"} to grow
        </p>
      </div>
    </div>
  );
}
