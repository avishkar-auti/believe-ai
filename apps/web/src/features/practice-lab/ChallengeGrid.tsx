import type { ChallengeSummary } from "@believe-ai/shared";
import { ChallengeCard } from "./ChallengeCard.js";
import { ChallengeCardSkeleton } from "./ChallengeCardSkeleton.js";
import { ChallengeLibraryEmptyState } from "./ChallengeLibraryEmptyState.js";
import { ChallengeLibraryErrorState } from "./ChallengeLibraryErrorState.js";

export function ChallengeGrid({
  isLoading,
  isError,
  onRetry,
  challenges,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  challenges: ChallengeSummary[];
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ChallengeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) return <ChallengeLibraryErrorState onRetry={onRetry} />;

  if (challenges.length === 0) return <ChallengeLibraryEmptyState />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {challenges.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </div>
  );
}
