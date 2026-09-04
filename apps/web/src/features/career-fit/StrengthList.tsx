import { Check } from "lucide-react";

export function StrengthList({ strengths }: { strengths: string[] }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-section uppercase text-fg-subtle">
        <Check className="h-3.5 w-3.5 text-positive" /> Key strengths
      </p>
      <ul className="mt-2.5 space-y-2">
        {strengths.map((s) => (
          <li key={s} className="flex items-start gap-2.5 rounded-card bg-positive/[0.07] px-3.5 py-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
            <span className="text-sm leading-relaxed text-fg">{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
