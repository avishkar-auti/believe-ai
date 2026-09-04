import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { CompletionChecklist, type ChecklistItem } from "./CompletionChecklist.js";
import believeIcon from "../../assets/brand/believe-icon.png";

/** Tasteful, not noisy — a soft scale/glow pop on the mark, checklist items
 * revealing one by one, no confetti. Per the brief's "keep the success state
 * tasteful" note. */
export function AllSetStep({
  checklist,
  busy,
  error,
  onGoToDashboard,
  onExploreWorkspace,
  onTakeTour,
}: {
  checklist: ChecklistItem[];
  busy: boolean;
  error: boolean;
  onGoToDashboard: () => void;
  onExploreWorkspace: () => void;
  onTakeTour: () => void;
}) {
  return (
    <Card className="mx-auto max-w-md shadow-lift">
      <CardBody className="space-y-6 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center"
        >
          <motion.span
            aria-hidden="true"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="absolute inset-0 rounded-full bg-accent-soft blur-md"
          />
          <img src={believeIcon} alt="" className="relative h-14 w-14" />
        </motion.div>

        <div>
          <h1 className="text-[22px] font-semibold text-fg">You&rsquo;re all set!</h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-fg-subtle">
            Your believe.ai workspace is ready. Let&rsquo;s turn your goals into progress.
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface-2/40 p-4 text-left">
          <CompletionChecklist items={checklist} />
        </div>

        {error && <p className="text-sm text-critical">Couldn&rsquo;t save your details. Try again.</p>}

        <div className="space-y-2.5">
          <Button className="w-full" size="lg" onClick={onGoToDashboard} disabled={busy}>
            {busy ? "Setting up…" : "Go to dashboard"}
          </Button>
          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={onExploreWorkspace} disabled={busy}>
              Explore workspace
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onTakeTour} disabled={busy}>
              Take a tour
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
