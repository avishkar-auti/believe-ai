import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { SectionLabel } from "../../../components/ui/Surface.js";
import { cn } from "../../../lib/cn.js";

/**
 * Peer feedback for the turn that just finished. Ratings and the optional
 * comment go to the existing feedback endpoint — the aggregate then comes back
 * over the socket as the roster's average.
 */
export function FeedbackPanel({
  speakerName,
  questionText,
  submitting,
  onSubmit,
  onSkip,
}: {
  speakerName: string;
  questionText: string | null;
  submitting?: boolean;
  onSubmit: (rating: number, comment: string | null) => void;
  onSkip: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="surface-3 surface-edge rounded-2xl p-4 shadow-lift">
      <SectionLabel>Rate the last answer</SectionLabel>
      <p className="mt-1.5 text-h3 text-fg">{speakerName}</p>
      {questionText && <p className="mt-1 text-caption text-fg-muted">{questionText}</p>}

      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Rating out of five">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            onClick={() => setRating(value)}
            className="rounded-pill p-1 transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Star className={cn("h-6 w-6", value <= rating ? "fill-current text-caution" : "text-fg-subtle")} />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="One thing they did well, one thing to sharpen…"
        className="mt-3 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-label text-fg outline-none placeholder:text-fg-subtle focus:border-line-strong"
      />

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onSubmit(rating, comment.trim() || null)}
          disabled={rating === 0 || submitting}
        >
          {submitting ? "Sending…" : "Send feedback"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </div>
  );
}
