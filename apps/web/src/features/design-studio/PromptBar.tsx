import type { FormEvent } from "react";
import { ArrowUp, Download, Loader2, Play, X } from "lucide-react";
import type { DesignPlatform } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";

const PLATFORMS: { value: DesignPlatform; label: string }[] = [
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobile" },
];

interface PromptBarProps {
  selectedScreenTitle: string | null;
  onDeselect: () => void;
  prompt: string;
  setPrompt: (value: string) => void;
  platform: DesignPlatform;
  setPlatform: (value: DesignPlatform) => void;
  instruction: string;
  setInstruction: (value: string) => void;
  onSubmitGenerate: (e: FormEvent) => void;
  onSubmitEdit: (e: FormEvent) => void;
  isPending: boolean;
  error: string | null;
  onExport: () => void;
  downloading: boolean;
  onPreview: () => void;
}

/** The primary interaction surface, floating bottom-center over the canvas —
 * matches the real Stitch layout (confirmed against the actual product, not
 * the earlier persistent-sidebar guess). Styled dark, matching the always-
 * dark canvas workspace rather than the app's light/dark toggle. The send
 * button mirrors the landing page's own empty→filled state: a faint outline
 * circle until there's text, then a solid filled circle with the arrow. */
export function PromptBar(props: PromptBarProps) {
  const {
    selectedScreenTitle,
    onDeselect,
    prompt,
    setPrompt,
    platform,
    setPlatform,
    instruction,
    setInstruction,
    onSubmitGenerate,
    onSubmitEdit,
    isPending,
    error,
    onExport,
    downloading,
    onPreview,
  } = props;

  const isEditing = selectedScreenTitle !== null;
  const value = isEditing ? instruction : prompt;
  const hasText = value.trim().length > 0;

  return (
    <div className="absolute bottom-6 left-1/2 z-10 w-[min(600px,calc(100%-3rem))] -translate-x-1/2 space-y-2">
      {isEditing && (
        <div className="flex items-center justify-between gap-2 rounded-pill border border-ink-700 bg-ink-800/95 px-3 py-1.5 shadow-lift backdrop-blur">
          <span className="truncate text-xs font-medium text-ink-300">Editing: {selectedScreenTitle}</span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onPreview}
              aria-label="Preview"
              className="flex h-6 w-6 items-center justify-center rounded-pill text-ink-400 transition-colors hover:bg-ink-700 hover:text-ink-100"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={downloading}
              aria-label="Export PNG"
              className="flex h-6 w-6 items-center justify-center rounded-pill text-ink-400 transition-colors hover:bg-ink-700 hover:text-ink-100"
            >
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={onDeselect}
              aria-label="Stop editing"
              className="flex h-6 w-6 items-center justify-center rounded-pill text-ink-400 transition-colors hover:bg-ink-700 hover:text-ink-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={isEditing ? onSubmitEdit : onSubmitGenerate}
        className="rounded-2xl border border-ink-700 bg-ink-800/95 p-2.5 shadow-lift backdrop-blur"
      >
        <textarea
          value={value}
          onChange={(e) => (isEditing ? setInstruction(e.target.value) : setPrompt(e.target.value))}
          placeholder={isEditing ? "What would you like to change?" : "What would you like to change or create?"}
          rows={1}
          className="w-full resize-none border-0 bg-transparent p-1.5 text-sm text-ink-50 placeholder:text-ink-500 focus:outline-none"
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          {isEditing ? (
            <span />
          ) : (
            <div className="inline-flex rounded-pill border border-ink-700 bg-ink-900/60 p-1">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlatform(p.value)}
                  aria-pressed={platform === p.value}
                  className={cn(
                    "rounded-pill px-3 py-1 text-xs font-medium transition-all duration-200",
                    platform === p.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-white",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <button
            type="submit"
            disabled={isPending || !hasText}
            aria-label={isEditing ? "Apply edit" : "Generate"}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 disabled:cursor-not-allowed",
              hasText ? "bg-white text-ink-900 hover:scale-105" : "border border-ink-600 text-ink-600",
            )}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </form>
      {error && <p className="px-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
