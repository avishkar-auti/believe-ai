import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Loader2, Mic, Monitor, Plus, Smartphone, X } from "lucide-react";
import type { DesignPlatform } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { MULTI_SELECTION_CHIPS, SELECTION_CHIPS, WORKFLOW_MODES, type WorkflowMode } from "./studioConfig.js";
import { useSpeechInput } from "./useSpeechInput.js";

interface PromptDockProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  mode: WorkflowMode;
  onModeChange: (mode: WorkflowMode) => void;
  platform: DesignPlatform;
  onPlatformChange: (platform: DesignPlatform) => void;
  selectionCount: number;
  selectionLabel: string | null;
  onClearSelection: () => void;
  pending: boolean;
  error: string | null;
}

/** The command centre of the studio: one input that is selection-aware. With
 * nothing selected it creates; with a selection it refines or explores variations
 * of exactly those screens. */
export function PromptDock(props: PromptDockProps) {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeechInput((text) => props.onChange(props.value ? `${props.value} ${text}` : text));

  const hasText = props.value.trim().length > 0;
  const chips = props.selectionCount > 1 ? MULTI_SELECTION_CHIPS : props.selectionCount === 1 ? SELECTION_CHIPS : [];

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 148)}px`;
  }, [props.value]);

  const placeholder =
    props.selectionCount > 1
      ? `What should change across these ${props.selectionCount} screens?`
      : props.selectionCount === 1
        ? "What would you like to change?"
        : "Describe what you want to design…";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 pb-4 sm:pb-6">
      <AnimatePresence>
        {chips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="pointer-events-auto flex max-w-[min(720px,100%)] flex-wrap justify-center gap-1.5"
          >
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  props.onChange(chip);
                  textareaRef.current?.focus();
                }}
                className="rounded-pill border border-line bg-surface-3/90 px-2.5 py-1 text-[11px] font-medium text-fg-muted shadow-flat backdrop-blur-[var(--liquid-blur-sm)] transition-colors duration-150 hover:border-line-strong hover:text-fg"
              >
                {chip}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto w-[min(720px,100%)] space-y-1.5">
        {props.selectionLabel && (
          <div className="flex items-center justify-between gap-2 rounded-pill border border-line bg-surface-3/90 px-3 py-1.5 shadow-flat backdrop-blur-[var(--liquid-blur-sm)]">
            <span className="truncate text-[11px] font-medium text-fg-muted">
              Scoped to <span className="text-fg">{props.selectionLabel}</span>
            </span>
            <button
              type="button"
              onClick={props.onClearSelection}
              aria-label="Clear selection"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-pill text-fg-subtle transition-colors duration-150 hover:bg-surface-4 hover:text-fg"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <motion.form
          onSubmit={props.onSubmit}
          animate={{ paddingTop: focused || hasText ? 12 : 8, paddingBottom: focused || hasText ? 10 : 8 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className={cn(
            "rounded-2xl border border-line bg-surface-3/85 px-3 shadow-lift backdrop-blur-[var(--liquid-blur-lg)] transition-colors duration-200",
            focused && "border-line-strong",
          )}
          style={{ boxShadow: "inset 0 1px 0 var(--line-highlight), var(--shadow-3)" }}
        >
          <div className="flex items-end gap-2">
            <PlusMenu onPickPlatform={props.onPlatformChange} platform={props.platform} />
            <textarea
              ref={textareaRef}
              value={props.value}
              onChange={(e) => props.onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  props.onSubmit(e);
                }
              }}
              rows={1}
              placeholder={placeholder}
              className="max-h-[148px] min-h-[24px] flex-1 resize-none border-0 bg-transparent py-1 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
            />
            {speech.supported && (
              <button
                type="button"
                onClick={speech.toggle}
                aria-label={speech.listening ? "Stop listening" : "Dictate prompt"}
                title={speech.listening ? "Listening…" : "Dictate prompt"}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-fg-muted transition-colors duration-150 hover:bg-surface-4 hover:text-fg",
                  speech.listening && "bg-accent-soft text-accent",
                )}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={props.pending || !hasText}
              aria-label="Send to Believe Designer"
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill transition-all duration-150 disabled:cursor-not-allowed",
                hasText ? "bg-accent text-accent-fg hover:bg-accent-hover" : "border border-line-strong text-fg-subtle",
              )}
            >
              {props.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="inline-flex rounded-pill border border-line bg-surface-2/70 p-0.5">
              {WORKFLOW_MODES.map((m) => {
                const disabled = m.value !== "create" && props.selectionCount === 0;
                return (
                  <button
                    key={m.value}
                    type="button"
                    title={disabled ? "Select a screen first" : m.hint}
                    disabled={disabled}
                    onClick={() => props.onModeChange(m.value)}
                    aria-pressed={props.mode === m.value}
                    className={cn(
                      "rounded-pill px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
                      props.mode === m.value ? "bg-surface-4 text-fg shadow-flat" : "text-fg-subtle hover:text-fg",
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {props.selectionCount === 0 && (
              <div className="inline-flex rounded-pill border border-line bg-surface-2/70 p-0.5">
                <PlatformButton
                  active={props.platform === "web"}
                  onClick={() => props.onPlatformChange("web")}
                  label="Desktop"
                  icon={<Monitor className="h-3 w-3" />}
                />
                <PlatformButton
                  active={props.platform === "mobile"}
                  onClick={() => props.onPlatformChange("mobile")}
                  label="Mobile"
                  icon={<Smartphone className="h-3 w-3" />}
                />
              </div>
            )}
          </div>
        </motion.form>

        {props.error && <p className="px-2 text-[11px] text-critical">{props.error}</p>}
        {speech.listening && <p className="px-2 text-[11px] text-fg-subtle">Listening…</p>}
      </div>
    </div>
  );
}

function PlatformButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-medium transition-colors duration-150",
        active ? "bg-surface-4 text-fg shadow-flat" : "text-fg-subtle hover:text-fg",
      )}
    >
      {icon} {label}
    </button>
  );
}

/** Only exposes what the backend actually accepts today: a text brief and the
 * target platform. Image/URL/code ingestion isn't offered because nothing would
 * consume it. */
function PlusMenu({
  platform,
  onPickPlatform,
}: {
  platform: DesignPlatform;
  onPickPlatform: (platform: DesignPlatform) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Add context"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-pill text-fg-muted transition-colors duration-150 hover:bg-surface-4 hover:text-fg"
      >
        <Plus className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button type="button" aria-label="Close" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              className="absolute bottom-10 left-0 z-20 w-56 rounded-xl border border-line bg-surface-3/95 p-1.5 shadow-lift backdrop-blur-[var(--liquid-blur-lg)]"
            >
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Target device</p>
              {(["web", "mobile"] as DesignPlatform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onPickPlatform(p);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors duration-150 hover:bg-surface-4",
                    platform === p ? "text-fg" : "text-fg-muted",
                  )}
                >
                  {p === "web" ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                  {p === "web" ? "Desktop screen" : "Mobile screen"}
                </button>
              ))}
              <div className="my-1 h-px bg-line" />
              <p className="px-2 pb-1 text-[10px] leading-relaxed text-fg-subtle">
                Image, URL and code references aren't supported by the design engine yet.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
