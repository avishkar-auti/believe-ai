import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import { Button } from "../../components/ui/Button.js";

const NEXT_LABEL: Record<number, string> = {
  1: "Next: Recipients",
  2: "Next: Content",
  3: "Next: Follow-ups",
  4: "Review campaign",
};

export function CampaignActionBar({
  step,
  onBack,
  onNext,
  onSaveDraft,
  onLaunch,
  submitting,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onLaunch: () => void;
  submitting: boolean;
}) {
  return (
    <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-panel border border-line bg-surface/95 p-3 shadow-lift backdrop-blur-sm">
      <Button variant="ghost" onClick={onBack} disabled={step === 1}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {step < 5 ? (
        <Button onClick={onNext}>
          {NEXT_LABEL[step]} <ArrowRight className="h-4 w-4" />
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onSaveDraft} disabled={submitting}>
            Save draft
          </Button>
          <Button onClick={onLaunch} disabled={submitting}>
            <Rocket className="h-4 w-4" /> Launch campaign
          </Button>
        </div>
      )}
    </div>
  );
}
