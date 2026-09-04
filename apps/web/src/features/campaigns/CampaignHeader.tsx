import { Send } from "lucide-react";
import { Button } from "../../components/ui/Button.js";

/** No "Saved just now" / autosave claim here — campaign creation has no
 * incremental persistence (a single POST only fires on final submit, see
 * CreateCampaignPage.tsx), so the only honest status to show is that this
 * is, and remains, a draft until launched. */
export function CampaignHeader({ onSaveDraft, savingDraft }: { onSaveDraft: () => void; savingDraft: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-fg">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <p className="text-section uppercase text-accent">Outreach workspace</p>
          <h1 className="text-h1 text-fg">Create campaign</h1>
          <p className="mt-0.5 text-caption text-fg-muted">Build a personalized outreach sequence for your audience.</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-1.5 text-caption text-fg-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-fg-subtle" /> Draft
        </span>
        <Button variant="secondary" size="sm" onClick={onSaveDraft} disabled={savingDraft}>
          {savingDraft ? "Saving…" : "Save draft"}
        </Button>
      </div>
    </div>
  );
}
