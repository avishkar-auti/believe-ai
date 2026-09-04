import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ExternalLink, FileText, Monitor, Search, Smartphone } from "lucide-react";
import type { Campaign, Contact, Resume, Template, User } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { Select } from "../../components/ui/Select.js";
import { previewTemplate } from "../templates/templatesApi.js";
import { EmailPreview } from "./EmailPreview.js";
import { StepTitle } from "./StepTitle.js";
import { useTemplateUsageCounts } from "./useTemplateUsageCounts.js";
import { buildVariableValues, findMissingVariables } from "./templateVariables.js";

export function CampaignContentStep({
  subject,
  templateId,
  onTemplateChange,
  resumeId,
  onResumeChange,
  templates,
  resumes,
  campaigns,
  recipients,
  sender,
}: {
  subject: string;
  templateId: string;
  onTemplateChange: (id: string) => void;
  resumeId: string;
  onResumeChange: (id: string) => void;
  templates: Template[] | undefined;
  resumes: Resume[] | undefined;
  campaigns: Campaign[] | undefined;
  recipients: Contact[];
  sender: User | undefined;
}) {
  const [search, setSearch] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewRecipientId, setPreviewRecipientId] = useState("");
  const usageCounts = useTemplateUsageCounts(campaigns);

  useEffect(() => {
    if (recipients.length > 0 && !recipients.some((r) => r.id === previewRecipientId)) setPreviewRecipientId(recipients[0]!.id);
  }, [recipients, previewRecipientId]);

  const filtered = templates?.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase())) ?? [];
  const selectedTemplate = templates?.find((t) => t.id === templateId);
  const recipient = recipients.find((r) => r.id === previewRecipientId);
  const values = buildVariableValues(recipient, sender);

  const previewQuery = useQuery({
    queryKey: ["template-preview", templateId, previewRecipientId, subject],
    queryFn: () =>
      previewTemplate({
        subject: subject.trim() || selectedTemplate!.subject,
        body: selectedTemplate!.body,
        bodyFormat: selectedTemplate!.bodyFormat,
        values,
      }),
    enabled: Boolean(selectedTemplate && recipient),
  });

  const missing = selectedTemplate ? findMissingVariables(subject.trim() || selectedTemplate.subject, selectedTemplate.body, values) : [];
  const attachedResume = resumes?.find((r) => r.id === resumeId);

  return (
    <div>
      <StepTitle icon={<FileText className="h-4 w-4" />} title="Choose the opening message" description="Select an existing template for the first email in this campaign." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_3fr]">
        <div>
          <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-fg-subtle">Select template</p>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="h-9 w-full rounded-control border border-line bg-surface pl-8 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
            />
          </div>

          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {filtered.map((t) => {
              const selected = t.id === templateId;
              const usage = usageCounts[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTemplateChange(t.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-control border p-3 text-left transition-colors",
                    selected ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong hover:bg-surface-2",
                  )}
                >
                  <FileText className={cn("mt-0.5 h-4 w-4 shrink-0", selected ? "text-accent" : "text-fg-subtle")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-label font-medium text-fg">{t.name}</p>
                      {usage && <span className="shrink-0 rounded-pill bg-positive/10 px-1.5 py-0.5 text-[10px] font-medium text-positive">Used in {usage} campaign{usage === 1 ? "" : "s"}</span>}
                    </div>
                    <p className="truncate text-caption text-fg-subtle">{t.subject}</p>
                  </div>
                  <span className={cn("mt-1 h-3.5 w-3.5 shrink-0 rounded-pill border", selected ? "border-accent bg-accent" : "border-line-strong")} />
                </button>
              );
            })}
            {filtered.length === 0 && <p className="py-4 text-center text-caption text-fg-subtle">No templates match "{search}".</p>}
          </div>

          <Link to="/app/templates" className="mt-2.5 inline-flex items-center gap-1 text-caption font-medium text-accent hover:underline">
            Manage templates <ExternalLink className="h-3 w-3" />
          </Link>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-caption font-semibold uppercase tracking-wide text-fg-subtle">Attachment (optional)</p>
            <p className="mt-0.5 text-caption text-fg-muted">Attach a resume or relevant document.</p>
            {resumes && resumes.length > 0 ? (
              <Select className="mt-2 !h-10" value={resumeId} onChange={(e) => onResumeChange(e.target.value)}>
                <option value="">Don't attach a resume</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {(r.targetRole ?? r.fileName) + (r.isPrimary ? " (Primary)" : "")}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="mt-2 text-caption text-fg-subtle">No resumes uploaded yet.</p>
            )}
            {attachedResume && <p className="mt-1.5 text-caption text-fg-subtle">This attachment will be included in the initial email only.</p>}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-caption font-semibold uppercase tracking-wide text-fg-subtle">Email preview</p>
              <p className="mt-0.5 text-caption text-fg-muted">Preview how this email will look for a selected recipient.</p>
            </div>
            <div className="inline-flex rounded-pill border border-line bg-surface-2 p-0.5">
              <button type="button" onClick={() => setPreviewMode("desktop")} className={cn("flex items-center gap-1 rounded-pill px-2 py-1 text-xs", previewMode === "desktop" ? "bg-surface-4 text-fg" : "text-fg-subtle")}>
                <Monitor className="h-3 w-3" /> Desktop
              </button>
              <button type="button" onClick={() => setPreviewMode("mobile")} className={cn("flex items-center gap-1 rounded-pill px-2 py-1 text-xs", previewMode === "mobile" ? "bg-surface-4 text-fg" : "text-fg-subtle")}>
                <Smartphone className="h-3 w-3" /> Mobile
              </button>
            </div>
          </div>

          {recipients.length > 0 && (
            <label className="mt-3 flex items-center gap-2 text-caption text-fg-muted">
              Preview as
              <Select className="!h-9 flex-1" value={previewRecipientId} onChange={(e) => setPreviewRecipientId(e.target.value)}>
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.firstName} {r.lastName}
                  </option>
                ))}
              </Select>
            </label>
          )}

          <div className={cn("mt-3", previewMode === "mobile" && "mx-auto max-w-xs")}>
            {!selectedTemplate ? (
              <p className="rounded-control border border-dashed border-line p-6 text-center text-caption text-fg-subtle">Select a template to see a preview.</p>
            ) : (
              <EmailPreview
                recipient={recipient}
                subject={previewQuery.data?.subject ?? (subject.trim() || selectedTemplate.subject)}
                body={previewQuery.data?.body ?? selectedTemplate.body}
                missingVariables={missing}
                loading={previewQuery.isFetching && !previewQuery.data}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
