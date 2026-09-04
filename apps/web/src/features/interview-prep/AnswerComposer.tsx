import { useRef } from "react";
import { ArrowUp, Mic } from "lucide-react";
import { Textarea } from "../../components/ui/Textarea.js";
import { Button } from "../../components/ui/Button.js";
import { cn } from "../../lib/cn.js";
import { useVoiceInput } from "./useVoiceInput.js";

export function AnswerComposer({
  value,
  onChange,
  onSubmit,
  submitting,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const baseTextRef = useRef("");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { supported, listening, toggle } = useVoiceInput((transcript) => {
    const base = baseTextRef.current;
    onChangeRef.current(base ? `${base} ${transcript}` : transcript);
  });

  function handleToggleVoice() {
    if (!listening) baseTextRef.current = value;
    toggle();
  }

  return (
    <div className="rounded-panel border border-line bg-surface p-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer or use voice input…"
        rows={4}
        className="resize-none border-none bg-transparent p-1 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        {supported ? (
          <button
            type="button"
            onClick={handleToggleVoice}
            className={cn(
              "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-caption font-medium transition-colors",
              listening ? "bg-critical/10 text-critical" : "bg-surface-2 text-fg-muted hover:text-fg",
            )}
          >
            <Mic className={cn("h-3.5 w-3.5", listening && "animate-pulse")} />
            {listening ? "Listening…" : "Voice"}
          </button>
        ) : (
          <span />
        )}
        <Button onClick={onSubmit} disabled={!value.trim() || submitting} size="sm">
          {submitting ? "Analyzing…" : "Submit answer"}
          <ArrowUp className="h-3.5 w-3.5 rotate-45" />
        </Button>
      </div>
    </div>
  );
}
