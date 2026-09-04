import { SearchX } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState.js";

export function ChallengeLibraryEmptyState() {
  return (
    <EmptyState
      icon={<SearchX className="h-5 w-5 text-fg-subtle" />}
      title="No challenges match your filters"
      description="Try a different track, difficulty, or search term."
    />
  );
}
