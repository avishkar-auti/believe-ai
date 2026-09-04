import { Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button.js";

export function EmptyProjectsState({ onCreateWithAI, onOpenBlankCanvas }: { onCreateWithAI: () => void; onOpenBlankCanvas: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
      <Sparkles className="h-6 w-6 text-accent" />
      <p className="text-label font-semibold text-fg">Your first idea starts here.</p>
      <p className="max-w-sm text-caption text-fg-muted">Describe what you want to build and Believe AI will turn it into an editable design.</p>
      <div className="mt-2 flex items-center gap-2">
        <Button onClick={onCreateWithAI}>
          <Sparkles className="h-4 w-4" /> Create with AI
        </Button>
        <Button variant="secondary" onClick={onOpenBlankCanvas}>
          Open blank canvas
        </Button>
      </div>
    </div>
  );
}
