import { AlertTriangle } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Button } from "../../components/ui/Button.js";

export function JobLibraryErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-5 w-5 text-critical" />}
      title="We couldn't load opportunities."
      action={
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}
