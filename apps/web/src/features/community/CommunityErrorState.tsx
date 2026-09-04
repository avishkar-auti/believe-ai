import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "../../components/ui/Button.js";

export function CommunityErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-critical/10">
        <CircleAlert className="h-5 w-5 text-critical" />
      </div>
      <div>
        <p className="text-h3 text-fg">Couldn't load community posts</p>
        <p className="mt-1 text-sm text-fg-muted">Something went wrong while loading the community.</p>
      </div>
      <Button variant="secondary" onClick={onRetry}>
        <RotateCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
