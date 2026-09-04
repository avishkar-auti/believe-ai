import { Briefcase } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Button } from "../../components/ui/Button.js";

export function JobLibraryEmptyState({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={<Briefcase className="h-5 w-5 text-fg-subtle" />}
      title="No jobs found"
      description={hasFilters ? "We couldn't find roles matching those filters." : "No opportunities to show yet — check back soon."}
      action={
        hasFilters ? (
          <Button variant="secondary" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : undefined
      }
    />
  );
}
