import { Minus, Plus, Send } from "lucide-react";
import { Input } from "../../components/ui/Input.js";
import { StepTitle } from "./StepTitle.js";

function FieldLabel({ children }: { children: string }) {
  return <span className="mb-1.5 block text-label font-medium text-fg">{children}</span>;
}

export function CampaignDetailsStep({
  name,
  onNameChange,
  subject,
  onSubjectChange,
  dailyLimit,
  onDailyLimitChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  subject: string;
  onSubjectChange: (v: string) => void;
  dailyLimit: number;
  onDailyLimitChange: (v: number) => void;
}) {
  return (
    <div className="space-y-5">
      <StepTitle icon={<Send className="h-4 w-4" />} title="Campaign details" description="Set the basics for your outreach campaign." />

      <label className="block">
        <FieldLabel>Campaign name</FieldLabel>
        <Input placeholder="Backend Engineer Outreach" required value={name} onChange={(e) => onNameChange(e.target.value)} />
      </label>

      <label className="block">
        <FieldLabel>Subject line</FieldLabel>
        <Input
          placeholder="Interested in the Backend Engineer opportunity"
          required
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
        />
      </label>

      <div>
        <FieldLabel>Sending pace</FieldLabel>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onDailyLimitChange(Math.max(1, dailyLimit - 10))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-control border border-line bg-surface text-sm font-medium text-fg">
            {dailyLimit} emails/day
          </div>
          <button
            type="button"
            onClick={() => onDailyLimitChange(Math.min(2000, dailyLimit + 10))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-caption text-fg-muted">Maximum number of emails sent per day. You can change this later.</p>
      </div>
    </div>
  );
}
