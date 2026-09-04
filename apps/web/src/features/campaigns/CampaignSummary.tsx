import type { CampaignFollowUp, Template } from "@believe-ai/shared";
import { Clock, FileText, Gauge, Mail, Paperclip, Users } from "lucide-react";
import { SectionLabel } from "../../components/ui/Surface.js";
import { FollowUpTimeline } from "./FollowUpTimeline.js";

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-fg-subtle">{icon}</span>
      <div className="min-w-0">
        <p className="text-caption text-fg-subtle">{label}</p>
        <p className="truncate text-label font-medium text-fg">{value}</p>
      </div>
    </div>
  );
}

/** Every value here comes straight from the live draft state — nothing is
 * hardcoded, and anything not yet set reads "Not configured" rather than a
 * placeholder example. */
export function CampaignSummary({
  name,
  audienceCount,
  templateName,
  resumeName,
  followUps,
  templates,
  dailyLimit,
}: {
  name: string;
  audienceCount: number;
  templateName: string | undefined;
  resumeName: string | null;
  followUps: CampaignFollowUp[];
  templates: Template[] | undefined;
  dailyLimit: number;
}) {
  const lastDay = followUps.reduce((sum, f) => sum + f.delayDays, 0);
  const duration = followUps.length === 0 ? "Same day" : `~${lastDay} day${lastDay === 1 ? "" : "s"}`;

  return (
    <div className="space-y-5 rounded-panel border border-line bg-surface p-4">
      <div>
        <div className="flex items-center justify-between">
          <SectionLabel>Campaign summary</SectionLabel>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-caption text-fg-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-fg-subtle" /> Draft
        </p>
      </div>

      <div className="space-y-3.5">
        <SummaryRow icon={<Mail className="h-3.5 w-3.5" />} label="Campaign" value={name.trim() || "Not configured"} />
        <SummaryRow icon={<Users className="h-3.5 w-3.5" />} label="Audience" value={audienceCount > 0 ? `${audienceCount} recipient${audienceCount === 1 ? "" : "s"}` : "Not configured"} />
        <SummaryRow icon={<FileText className="h-3.5 w-3.5" />} label="Initial email" value={templateName ?? "Not configured"} />
        <SummaryRow icon={<Paperclip className="h-3.5 w-3.5" />} label="Attachment" value={resumeName ?? "None"} />
        <SummaryRow icon={<Clock className="h-3.5 w-3.5" />} label="Follow-ups" value={followUps.length > 0 ? `${followUps.length} step${followUps.length === 1 ? "" : "s"}` : "None"} />
        <SummaryRow icon={<Gauge className="h-3.5 w-3.5" />} label="Daily limit" value={`${dailyLimit} emails/day`} />
      </div>

      <div className="border-t border-line pt-4">
        <SectionLabel>Sequence preview</SectionLabel>
        <div className="mt-2.5">
          <FollowUpTimeline initialLabel={templateName ?? "Not configured"} followUps={followUps} templates={templates} compact />
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-line pt-3 text-caption text-fg-muted">
        <Clock className="h-3.5 w-3.5" /> Estimated duration: <span className="font-medium text-fg">{duration}</span>
      </div>
    </div>
  );
}
