import { useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import type { RoomIdea } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";

export function IdeaBoard({
  ideas,
  onPost,
  posting,
  disabled,
}: {
  ideas: RoomIdea[];
  onPost: (text: string) => void;
  posting?: boolean;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onPost(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit();
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Shared idea board</p>

        <div className="max-h-48 space-y-2 overflow-y-auto">
          <AnimatePresence initial={false}>
            {ideas.map((idea) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl bg-ink-50 px-3 py-2 text-sm dark:bg-ink-800/60"
              >
                <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{idea.authorName}</p>
                <p className="text-ink-800 dark:text-ink-100">{idea.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {ideas.length === 0 && (
            <p className="py-4 text-center text-xs text-ink-400">No notes yet for this question.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            className="h-9 flex-1 rounded-pill border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-ink-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
            placeholder="Drop a note…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
          <Button size="sm" onClick={submit} disabled={disabled || posting || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
