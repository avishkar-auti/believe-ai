import { forwardRef } from "react";
import { Sparkles } from "lucide-react";
import type { Resume } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { ResumePersonalization } from "./ResumePersonalization.js";
import { RoadmapGenerationState } from "./RoadmapGenerationState.js";

export const RoadmapGenerator = forwardRef<
  HTMLInputElement,
  {
    goal: string;
    onGoalChange: (value: string) => void;
    onBuild: () => void;
    building: boolean;
    error: boolean;
    personalize: boolean;
    onPersonalizeChange: (value: boolean) => void;
    resumes: Resume[] | undefined;
    selectedResumeId: string | undefined;
    onSelectResume: (id: string) => void;
  }
>(function RoadmapGenerator(
  { goal, onGoalChange, onBuild, building, error, personalize, onPersonalizeChange, resumes, selectedResumeId, onSelectResume },
  ref,
) {
  const hasResumes = Boolean(resumes && resumes.length > 0);

  return (
    <div className="rounded-panel border border-line bg-surface p-6 shadow-card ring-1 ring-inset ring-fg/[0.03]">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
        <Sparkles className="h-4 w-4 text-accent" /> Build your learning path
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Sparkles className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            ref={ref}
            placeholder="e.g. Kubernetes, System Design, Java, GenAI…"
            value={goal}
            onChange={(e) => onGoalChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goal.trim() && !building && onBuild()}
            className="h-12 w-full rounded-control border border-line bg-surface pl-11 pr-4 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
          />
        </div>
        <Button onClick={onBuild} disabled={!goal.trim() || building} className="sm:w-44">
          {building ? (
            <>
              <Spinner className="h-4 w-4" /> Building…
            </>
          ) : (
            "Build roadmap"
          )}
        </Button>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <ResumePersonalization
          personalize={personalize && hasResumes}
          onPersonalizeChange={onPersonalizeChange}
          resumes={resumes}
          selectedResumeId={selectedResumeId}
          onSelectResume={onSelectResume}
        />
      </div>

      {error && <p className="mt-3 text-caption text-critical">Couldn't build a roadmap — try again in a moment.</p>}

      {building && (
        <div className="mt-4">
          <RoadmapGenerationState personalized={personalize && hasResumes} />
        </div>
      )}
    </div>
  );
});
