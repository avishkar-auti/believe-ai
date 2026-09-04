import { CheckCircle2, TriangleAlert } from "lucide-react";
import type { Contact } from "@believe-ai/shared";

export function EmailPreview({
  recipient,
  subject,
  body,
  missingVariables,
  loading,
}: {
  recipient: Contact | undefined;
  subject: string;
  body: string;
  missingVariables: string[];
  loading?: boolean;
}) {
  if (!recipient) {
    return <p className="rounded-control border border-dashed border-line p-6 text-center text-caption text-fg-subtle">Select a recipient above to preview this email.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-control border border-line bg-surface">
        <div className="space-y-1.5 border-b border-line px-4 py-3">
          <div className="flex gap-2 text-caption">
            <span className="w-14 shrink-0 text-fg-subtle">To:</span>
            <span className="text-fg">
              {recipient.firstName} {recipient.lastName} &lt;{recipient.email}&gt;
            </span>
          </div>
          <div className="flex gap-2 text-caption">
            <span className="w-14 shrink-0 text-fg-subtle">Subject:</span>
            <span className="font-medium text-fg">{loading ? "…" : subject || "(no subject)"}</span>
          </div>
        </div>
        {loading ? (
          <div className="px-4 py-4 text-label leading-relaxed text-fg">Loading preview…</div>
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none px-4 py-4 leading-relaxed"
            // Safe: `body` here is always real HTML rendered server-side by
            // services/email_content.py's shared pipeline — the exact same
            // renderer the real outbound send uses, never raw unreviewed input.
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </div>

      {!loading &&
        (missingVariables.length === 0 ? (
          <p className="flex items-center gap-1.5 text-caption text-positive">
            <CheckCircle2 className="h-3.5 w-3.5" /> Variables resolved for this recipient
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-caption text-caution">
            <TriangleAlert className="h-3.5 w-3.5" />
            {missingVariables.length} variable{missingVariables.length === 1 ? "" : "s"} missing: {missingVariables.map((v) => `{{${v}}}`).join(", ")}
          </p>
        ))}
    </div>
  );
}
