import { MessageSquare, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button.js";

const STARTER_PROMPTS = ["What are you learning right now?", "Share a project you're building", "Ask for career advice"];

export function CommunityEmptyState({
  onCreatePost,
  onUsePrompt,
}: {
  onCreatePost: () => void;
  onUsePrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-card border border-line bg-surface px-6 py-12 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <span className="absolute inset-0 -z-10 rounded-full bg-accent/25 blur-xl" />
        <MessageSquare className="h-6 w-6 text-accent" />
      </div>
      <div>
        <p className="text-h3 text-fg">Start the conversation</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-fg-muted">
          This community is just getting started. Ask a question, share something you've learned, or celebrate a recent win.
        </p>
      </div>
      <Button onClick={onCreatePost}>
        <Plus className="h-4 w-4" /> Create the first post
      </Button>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onUsePrompt(prompt)}
            className="rounded-pill border border-line px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
