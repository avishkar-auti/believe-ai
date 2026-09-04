import { SectionLabel } from "../../components/ui/Surface.js";

/** No backend endpoint aggregates topic frequency yet — always called with
 * `topics` empty today. Kept as a real component (not inlined) so the
 * sidebar only needs to start passing real data once that endpoint exists. */
export function TrendingTopics({ topics }: { topics?: { label: string; count: number }[] }) {
  if (!topics || topics.length === 0) return null;

  return (
    <div>
      <SectionLabel>Trending topics</SectionLabel>
      <div className="mt-3 space-y-2.5">
        {topics.map((t) => (
          <div key={t.label} className="flex items-center justify-between text-sm">
            <span className="font-medium text-fg">#{t.label}</span>
            <span className="text-caption text-fg-subtle">{t.count} discussions</span>
          </div>
        ))}
      </div>
    </div>
  );
}
