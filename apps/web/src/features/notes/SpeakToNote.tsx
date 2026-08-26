import { useEffect, useRef, useState } from "react";
import { Mic, Square, X } from "lucide-react";
import type { VoiceCommandResult } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { cleanupTranscript, parseVoiceCommand } from "./notesApi.js";
import { markdownToDoc } from "./markdownToDoc.js";

// Not in TypeScript's lib.dom.d.ts — Web Speech API is still non-standard.
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: any) => void) | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  onerror: ((event: any) => void) | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function SpeakToNote({
  onClose,
  onInsert,
  onCommand,
  hasActiveNote,
}: {
  onClose: () => void;
  onInsert: (result: { title: string; content: Record<string, unknown> }) => void;
  onCommand: (command: VoiceCommandResult) => void;
  hasActiveNote: boolean;
}) {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const SpeechRecognitionCtor = getSpeechRecognition();

  useEffect(() => {
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript;
      }
      setTranscript(combined);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    return () => recognition.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFinish() {
    recognitionRef.current?.stop();
    if (!transcript.trim()) {
      onClose();
      return;
    }
    setCleaning(true);
    try {
      const command = await parseVoiceCommand(transcript, hasActiveNote);
      if (command.commandType !== "none") {
        onCommand(command);
        return;
      }
      const result = await cleanupTranscript(transcript);
      onInsert({ title: result.title, content: markdownToDoc(result.markdown) });
    } finally {
      setCleaning(false);
    }
  }

  if (!SpeechRecognitionCtor) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4" onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-ink-900" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm font-medium text-ink-800 dark:text-ink-100">Voice input isn't supported in this browser.</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Try Chrome or Edge, or just type your note instead.</p>
          <Button className="mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-ink-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white">
            <Mic className={listening ? "h-4 w-4 animate-pulse text-red-500" : "h-4 w-4 text-ink-400"} />
            {listening ? "Listening…" : "Paused"}
          </div>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-100">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="min-h-[100px] max-h-[240px] overflow-y-auto rounded-xl bg-ink-50 p-3 text-sm text-ink-700 dark:bg-ink-800/60 dark:text-ink-200">
          {transcript || <span className="text-ink-400">Start speaking — your words will appear here…</span>}
        </div>

        <div className="mt-4 flex justify-center gap-2">
          <Button variant="secondary" onClick={onClose} disabled={cleaning}>
            Cancel
          </Button>
          <Button onClick={() => void handleFinish()} disabled={cleaning}>
            <Square className="h-4 w-4" /> {cleaning ? "Organizing…" : "Finish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
