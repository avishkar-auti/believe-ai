import { Sparkles } from "lucide-react";

export function InterviewHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-line pb-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <p className="text-section uppercase text-accent">Practice workspace</p>
        <h1 className="text-h1 text-fg">Interview prep</h1>
        <p className="mt-0.5 text-caption text-fg-muted">Practice technical interviews with an AI coach grounded in your resume.</p>
      </div>
    </div>
  );
}
