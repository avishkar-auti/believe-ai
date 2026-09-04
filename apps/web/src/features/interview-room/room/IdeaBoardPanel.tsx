import { useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import type { RoomIdea } from "@believe-ai/shared";
import { Button } from "../../../components/ui/Button.js";
import { SectionLabel } from "../../../components/ui/Surface.js";
import { avatarTint, initials } from "./roomFormat.js";
import { cn } from "../../../lib/cn.js";

/** Shared idea board, scoped to the active question. Posts through the room's
 * existing idea endpoint; entries stream in over the socket. */
export function IdeaBoardPanel({
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
    <div className="flex h-full flex-col gap-3">
      <SectionLabel>Notes on this question</SectionLabel>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {ideas.map((idea) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="surface-2 flex gap-2.5 rounded-xl px-3 py-2.5"
            >
              <span
                className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-pill text-caption font-semibold", avatarTint(idea.authorUserId))}
                aria-hidden
              >
                {initials(idea.authorName)}
              </span>
              <div className="min-w-0">
                <p className="text-caption text-fg-subtle">{idea.authorName}</p>
                <p className="text-label text-fg">{idea.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {ideas.length === 0 && (
          <p className="py-8 text-center text-caption text-fg-subtle">
            No notes yet. Drop a structure, a metric, a follow-up question.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          className="h-9 flex-1 rounded-pill border border-line bg-surface px-3.5 text-label text-fg outline-none placeholder:text-fg-subtle focus:border-line-strong disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add a note…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="Add a note to the idea board"
        />
        <Button size="sm" onClick={submit} disabled={disabled || posting || !text.trim()} aria-label="Post note">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
