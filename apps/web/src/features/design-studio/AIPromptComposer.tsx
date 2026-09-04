import type { RefObject } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowUp, Loader2, Monitor, Smartphone, Sparkles } from "lucide-react";
import type { DesignPlatform } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { enhanceDesignPrompt } from "./designApi.js";

export function AIPromptComposer({
  value,
  onChange,
  platform,
  onPlatformChange,
  onSubmit,
  submitting,
  onOpenBlankCanvas,
  promptRef,
}: {
  value: string;
  onChange: (v: string) => void;
  platform: DesignPlatform;
  onPlatformChange: (p: DesignPlatform) => void;
  onSubmit: () => void;
  submitting: boolean;
  onOpenBlankCanvas: () => void;
  promptRef: RefObject<HTMLTextAreaElement>;
}) {
  const enhanceMutation = useMutation({
    mutationFn: () => enhanceDesignPrompt({ prompt: value.trim(), platform }),
    onSuccess: onChange,
  });

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-lift sm:p-5">
      <div className="flex items-center gap-1.5 text-sm font-medium text-fg-muted">
        <Sparkles className="h-4 w-4 text-accent" /> What would you like to design?
      </div>
      <textarea
        ref={promptRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={3}
        placeholder="Example: A modern fintech dashboard for tracking expenses, investments and monthly savings."
        className="mt-2 w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-pill border border-line bg-surface-2 p-0.5">
            <button
              type="button"
              onClick={() => onPlatformChange("web")}
              aria-pressed={platform === "web"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium transition-colors",
                platform === "web" ? "bg-surface-4 text-fg shadow-card" : "text-fg-subtle hover:text-fg",
              )}
            >
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => onPlatformChange("mobile")}
              aria-pressed={platform === "mobile"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium transition-colors",
                platform === "mobile" ? "bg-surface-4 text-fg shadow-card" : "text-fg-subtle hover:text-fg",
              )}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
          </div>
          {value.trim().length > 3 && (
            <button
              type="button"
              onClick={() => enhanceMutation.mutate()}
              disabled={enhanceMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-pill border border-line px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft disabled:opacity-50"
            >
              {enhanceMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Enhance prompt
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={onOpenBlankCanvas} className="text-xs font-medium text-fg-muted transition-colors hover:text-fg">
            Open blank canvas
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || value.trim().length === 0}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              "bg-gradient-to-r from-accent to-accent-hover text-accent-fg hover:opacity-90",
            )}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {submitting ? "Generating…" : "Generate"}
            {!submitting && <ArrowUp className="h-3.5 w-3.5 rotate-45" />}
          </button>
        </div>
      </div>
    </div>
  );
}
