export function FitSummary({ summary }: { summary: string }) {
  return (
    <div>
      <p className="text-section uppercase text-fg-subtle">Fit summary</p>
      <p className="mt-2 max-w-[46rem] text-[14.5px] leading-[1.6] text-fg-muted">{summary}</p>
    </div>
  );
}
