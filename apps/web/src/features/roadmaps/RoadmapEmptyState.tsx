import { Map } from "lucide-react";
import { Button } from "../../components/ui/Button.js";

const STARTING_POINTS = ["Kubernetes", "System Design", "Generative AI", "Java Backend", "Google Cloud"];

export function RoadmapEmptyState({ onUseTopic, onCreate }: { onUseTopic: (topic: string) => void; onCreate: () => void }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-panel border border-line bg-surface px-6 py-14 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <span className="absolute inset-0 -z-10 rounded-full bg-accent/25 blur-xl" />
        <Map className="h-6 w-6 text-accent" />
      </div>
      <div>
        <p className="text-h3 text-fg">Build your learning path</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-fg-muted">
          Tell us what you want to learn and we'll create a structured roadmap based on your existing experience.
        </p>
      </div>

      <div className="mt-1">
        <p className="mb-2 text-caption text-fg-subtle">Popular starting points</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {STARTING_POINTS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => onUseTopic(topic)}
              className="rounded-pill border border-line px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={onCreate} className="mt-1">
        Create my roadmap
      </Button>
    </div>
  );
}
