import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
import type { ChallengeTrack } from "@believe-ai/shared";
import { Spinner } from "../../components/ui/Spinner.js";
import { SectionLabel } from "../../components/ui/Surface.js";
import { fetchChallenges, fetchPracticeProgress } from "./practiceApi.js";
import { PhaseNotice } from "./PhaseNotice.js";
import { PracticeProgressSummary } from "./PracticeProgressSummary.js";
import { PracticeContinueCard } from "./PracticeContinueCard.js";
import { TrackOverviewCard } from "./TrackOverviewCard.js";
import { ChallengeCard } from "./ChallengeCard.js";

const TRACKS: ChallengeTrack[] = ["python-for-ai", "rag", "agents"];

export function PracticeOverviewPage() {
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["practice-progress"],
    queryFn: fetchPracticeProgress,
  });
  const { data: challenges, isLoading: challengesLoading } = useQuery({
    queryKey: ["practice-challenges", {}],
    queryFn: () => fetchChallenges(),
  });

  const countByTrack = (track: ChallengeTrack) => challenges?.items.filter((c) => c.track === track).length ?? 0;
  const featured = challenges?.items.slice(0, 3) ?? [];

  return (
    <div className="mx-auto max-w-content space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <h1 className="flex items-center gap-2.5 text-h1 text-fg">
          <Code2 className="h-6 w-6 text-accent" /> AI Practice Lab
        </h1>
        <p className="mt-1.5 text-label font-normal text-fg-muted">Practice real-world AI engineering through hands-on challenges.</p>
      </motion.div>

      <PhaseNotice />

      {!progressLoading && progress && (
        <div className="space-y-4">
          <PracticeProgressSummary progress={progress} />
          <PracticeContinueCard progress={progress} />
        </div>
      )}

      {featured.length > 0 && (
        <div>
          <SectionLabel>Featured challenges</SectionLabel>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionLabel>Explore skill tracks</SectionLabel>
        {challengesLoading ? (
          <div className="mt-3 flex justify-center py-8">
            <Spinner className="h-5 w-5 text-fg-subtle" />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TRACKS.map((track) => (
              <TrackOverviewCard key={track} track={track} count={countByTrack(track)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
