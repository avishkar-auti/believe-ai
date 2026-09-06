import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import type { CampaignFollowUp, Contact, Resume, Template } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { Select } from "../../components/ui/Select.js";
import { SectionLabel } from "../../components/ui/Surface.js";
import { previewTemplate } from "../templates/templatesApi.js";
import { EmailPreview } from "./EmailPreview.js";
import { FollowUpTimeline } from "./FollowUpTimeline.js";
import { StepTitle } from "./StepTitle.js";
import { findUnresolved, usePersonalizationContext } from "../templates/usePersonalization.js";
import { buildRecipientValues } from "./templateVariables.js";

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-label">
      {ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" /> : <Circle className="h-4 w-4 shrink-0 text-fg-subtle" />}
      <span className={ok ? "text-fg" : "text-fg-muted"}>{label}</span>
    </div>
  );
}

export function CampaignReviewStep({
  name,
  subject,
  dailyLimit,
  templateId,
  templates,
  resumeId,
  resumes,
  followUps,
  stopOnReply,
  recipients,
}: {
  name: string;
  subject: string;
  dailyLimit: number;
  templateId: string;
  templates: Template[] | undefined;
  resumeId: string;
  resumes: Resume[] | undefined;
  followUps: CampaignFollowUp[];
  stopOnReply: boolean;
  recipients: Contact[];
}) {
  const [previewRecipientId, setPreviewRecipientId] = useState(recipients[0]?.id ?? "");
  const template = templates?.find((t) => t.id === templateId);
  const resume = resumes?.find((r) => r.id === resumeId);
  const recipient = recipients.find((r) => r.id === previewRecipientId) ?? recipients[0];
  const personalization = usePersonalizationContext();
  const values = buildRecipientValues(recipient);
  const unresolved = template ? findUnresolved([subject.trim() || template.subject, template.body], values, personalization.data) : [];
  // Only sender variables block: they resolve from one profile, so an empty
  // one is empty in every email and the fix is a single edit. A contact
  // missing a job title is normal and shouldn't hold up the other 199.
  const blocking = unresolved.filter((u) => u.reason !== "recipient");

  const previewQuery = useQuery({
    queryKey: ["template-preview", "review", templateId, recipient?.id, subject],
    queryFn: () =>
      previewTemplate({
        subject: subject.trim() || template!.subject,
        body: template!.body,
        // Without this the server falls back to "text" and runs the
        // plain-text normalizer over real HTML, escaping every tag so the
        // review pane showed raw markup instead of the email.
        bodyFormat: template!.bodyFormat,
        values,
      }),
    enabled: Boolean(template && recipient),
  });

  const checks = [
    { ok: name.trim().length > 0 && subject.trim().length > 0, label: "Campaign configured" },
    { ok: recipients.length > 0, label: "Audience selected" },
    { ok: Boolean(templateId), label: "Initial template selected" },
    {
      ok: blocking.length === 0,
      label: blocking.length === 0 ? "Personalization variables resolved" : `Fill in your profile: ${blocking.map((u) => u.label).join(", ")}`,
    },
    { ok: dailyLimit > 0, label: "Sending limit configured" },
    { ok: stopOnReply, label: "Reply stop condition enabled" },
  ];

  return (
    <div className="space-y-5">
      <StepTitle icon={<Rocket className="h-4 w-4" />} title="Ready to launch?" description="Review your campaign before sending." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-control border border-line p-3.5">
          <SectionLabel>Campaign</SectionLabel>
          <p className="mt-1 text-label font-semibold text-fg">{name.trim() || "Untitled"}</p>
          <p className="text-caption text-fg-subtle">{subject.trim() || "No subject"}</p>
        </div>
        <div className="rounded-control border border-line p-3.5">
          <SectionLabel>Audience</SectionLabel>
          <p className="mt-1 text-label font-semibold text-fg">{recipients.length} recipient{recipients.length === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-control border border-line p-3.5">
          <SectionLabel>Initial email</SectionLabel>
          <p className="mt-1 text-label font-semibold text-fg">{template?.name ?? "Not selected"}</p>
        </div>
        <div className="rounded-control border border-line p-3.5">
          <SectionLabel>Attachment</SectionLabel>
          <p className="mt-1 text-label font-semibold text-fg">{resume ? (resume.targetRole ?? resume.fileName) : "None"}</p>
        </div>
        <div className="rounded-control border border-line p-3.5">
          <SectionLabel>Follow-ups</SectionLabel>
          <p className="mt-1 text-label font-semibold text-fg">{followUps.length} step{followUps.length === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-control border border-line p-3.5">
          <SectionLabel>Daily limit</SectionLabel>
          <p className="mt-1 text-label font-semibold text-fg">{dailyLimit}/day</p>
        </div>
      </div>

      {template && recipients.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <SectionLabel>Initial email preview</SectionLabel>
            <label className="flex items-center gap-2 text-caption text-fg-muted">
              Preview as
              <Select className="!h-8 w-40" value={previewRecipientId} onChange={(e) => setPreviewRecipientId(e.target.value)}>
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.firstName} {r.lastName}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <div className="mt-2">
            <EmailPreview
              recipient={recipient}
              subject={previewQuery.data?.subject ?? (subject.trim() || template.subject)}
              body={previewQuery.data?.body ?? template.body}
              unresolved={unresolved}
              loading={previewQuery.isFetching && !previewQuery.data}
            />
          </div>
        </div>
      )}

      <div>
        <SectionLabel>Sequence</SectionLabel>
        <div className="mt-2">
          <FollowUpTimeline initialLabel={template?.name ?? "Not selected"} followUps={followUps} templates={templates} />
        </div>
      </div>

      <div className={cn("rounded-control border p-4", checks.every((c) => c.ok) ? "border-positive/25 bg-positive/5" : "border-line")}>
        <SectionLabel>Pre-launch checks</SectionLabel>
        <div className="mt-2.5 space-y-2">
          {checks.map((c) => (
            <CheckRow key={c.label} ok={c.ok} label={c.label} />
          ))}
        </div>
      </div>
    </div>
  );
}
