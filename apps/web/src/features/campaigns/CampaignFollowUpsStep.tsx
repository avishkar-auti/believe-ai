import { Plus, Trash2 } from "lucide-react";
import type { CampaignFollowUp, Template } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Checkbox } from "../../components/ui/Checkbox.js";
import { Input } from "../../components/ui/Input.js";
import { StepTitle } from "./StepTitle.js";
import { TemplateSelect } from "./TemplateSelect.js";

export function CampaignFollowUpsStep({
  followUps,
  templates,
  onAdd,
  onUpdate,
  onRemove,
  stopOnReply,
  onStopOnReplyChange,
}: {
  followUps: CampaignFollowUp[];
  templates: Template[] | undefined;
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<CampaignFollowUp>) => void;
  onRemove: (index: number) => void;
  stopOnReply: boolean;
  onStopOnReplyChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
        <StepTitle icon={<Plus className="h-4 w-4" />} title="Plan follow-ups" description="Set the timing and template for each follow-up." />
        <Button type="button" variant="secondary" size="sm" onClick={onAdd} className="shrink-0">
          <Plus className="h-4 w-4" /> Add follow-up
        </Button>
      </div>

      {followUps.map((followUp, index) => {
        const template = templates?.find((t) => t.id === followUp.templateId);
        return (
          <div key={index} className="rounded-control border border-line p-4">
            <div className="flex items-center justify-between">
              <p className="text-label font-semibold text-fg">Follow-up #{index + 1}</p>
              <button type="button" onClick={() => onRemove(index)} className="text-fg-subtle transition-colors hover:text-critical" aria-label="Delete follow-up">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-caption text-fg-muted">
                Send after
                <Input type="number" min={1} max={90} value={followUp.delayDays} onChange={(e) => onUpdate(index, { delayDays: Number(e.target.value) })} className="!h-9 w-16" />
                days after previous step
              </label>
            </div>
            <label className="mt-2.5 block">
              <span className="mb-1 block text-caption text-fg-muted">Template</span>
              <TemplateSelect templates={templates} value={followUp.templateId} onChange={(id) => onUpdate(index, { templateId: id })} className="!h-10" />
            </label>
            {template && <p className="mt-2 truncate text-caption text-fg-subtle">"{template.subject}"</p>}
          </div>
        );
      })}

      {followUps.length === 0 && <p className="text-caption text-fg-subtle">No follow-ups — this campaign will send once, with no reminders.</p>}

      <div className="border-t border-line pt-4">
        <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-fg-subtle">Automation rules</p>
        <label className="flex items-center gap-2">
          <Checkbox checked={stopOnReply} onChange={(e) => onStopOnReplyChange(e.target.checked)} />
          <span className="text-label text-fg">Stop sequence when recipient replies</span>
          <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">Recommended</span>
        </label>
      </div>
    </div>
  );
}
