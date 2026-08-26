import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { cn } from "../../lib/cn.js";

/** Slides up from the bottom right after a turn ends, prompting everyone
 * except the speaker who just finished to rate that turn. Dismissible —
 * feedback is optional, not a blocking gate. */
export function FeedbackDrawer({
  speakerName,
  onSubmit,
  onDismiss,
  submitting,
}: {
  speakerName: string;
  onSubmit: (rating: number, comment: string | null) => void;
  onDismiss: () => void;
  submitting?: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  function submit() {
    if (!rating) return;
    onSubmit(rating, comment.trim() || null);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-6 right-6 z-40 w-80"
      >
        <Card className="shadow-lg">
          <CardBody className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-ink-900 dark:text-white">Rate {speakerName}&apos;s turn</p>
              <button
                type="button"
                onClick={onDismiss}
                className="text-ink-400 transition-colors hover:text-ink-600 dark:hover:text-ink-200"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      (hoverRating || rating) >= value
                        ? "fill-amber-400 text-amber-400"
                        : "text-ink-300 dark:text-ink-600",
                    )}
                  />
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Optional comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="text-sm"
            />

            <Button size="sm" className="w-full" onClick={submit} disabled={!rating || submitting}>
              Submit
            </Button>
          </CardBody>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
