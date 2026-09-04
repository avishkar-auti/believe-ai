import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Square, X } from "lucide-react";
import type { VoiceCommandResult } from "@believe-ai/shared";
import { cleanupTranscript, parseVoiceCommand } from "./notesApi.js";
import { markdownToDoc } from "./markdownToDoc.js";
import { Z } from "../../lib/zIndex.js";
import { cn } from "../../lib/cn.js";

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
      <AnimatePresence>
        <div className={cn("fixed inset-0 flex items-center justify-center p-4", Z.overlay)}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-fg/40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="relative w-full max-w-sm rounded-card surface-4 surface-edge p-6 text-center shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-label font-medium text-fg">Voice input isn't supported in this browser.</p>
            <p className="mt-1 text-caption text-fg-muted">Try Chrome or Edge, or just type your note instead.</p>
            <button type="button" onClick={onClose} className="mt-4 rounded-pill bg-accent px-4 py-2 text-caption font-semibold text-accent-fg">
              Close
            </button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className={cn("fixed inset-0 flex items-center justify-center p-4", Z.overlay)}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-fg/40" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-card surface-4 surface-edge p-6 shadow-lift"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-label font-semibold text-fg">
              <Mic className={listening ? "h-4 w-4 animate-pulse text-critical" : "h-4 w-4 text-fg-subtle"} />
              {listening ? "Listening…" : "Paused"}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="text-fg-subtle hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-[100px] max-h-[240px] overflow-y-auto rounded-xl surface-2 p-3 text-label text-fg">
            {transcript || <span className="text-fg-subtle">Start speaking — your words will appear here…</span>}
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={cleaning}
              className="rounded-pill border border-line px-4 py-2 text-caption font-medium text-fg transition-colors hover:bg-fg/[0.05] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={cleaning}
              className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-4 py-2 text-caption font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              <Square className="h-3.5 w-3.5" /> {cleaning ? "Organizing…" : "Finish"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
