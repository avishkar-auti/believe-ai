import { CheckCircle2, TriangleAlert } from "lucide-react";
import type { Contact } from "@believe-ai/shared";
import type { UnresolvedVariable } from "../templates/usePersonalization.js";

/** One line per fixable cause, so the warning names the remedy instead of
 * just counting problems. */
const GROUPS = [
  { reason: "sender" as const, prefix: "Empty on your profile:", suffix: "— fill these in on the Profile page." },
  { reason: "recipient" as const, prefix: "Not set for this contact:", suffix: "— it will render as blank text." },
  { reason: "unknown" as const, prefix: "Not a real variable:", suffix: "— check the spelling in your template." },
];

export function EmailPreview({
  recipient,
  subject,
  body,
  unresolved,
  loading,
}: {
  recipient: Contact | undefined;
  subject: string;
  body: string;
  /** Variables that render blank, tagged with what would fix each — a sender
   * field is a gap in your profile that affects every recipient, while a
   * recipient field is just missing on this one contact. Conflating the two
   * was why "3 variables missing" never told anyone what to actually do. */
  unresolved: UnresolvedVariable[];
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
        (unresolved.length === 0 ? (
          <p className="flex items-center gap-1.5 text-caption text-positive">
            <CheckCircle2 className="h-3.5 w-3.5" /> Variables resolved for this recipient
          </p>
        ) : (
          <div className="space-y-1">
            {GROUPS.map(({ reason, prefix, suffix }) => {
              const hit = unresolved.filter((u) => u.reason === reason);
              if (hit.length === 0) return null;
              return (
                <p key={reason} className="flex items-start gap-1.5 text-caption text-caution">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {prefix} {hit.map((u) => `{{${u.key}}}`).join(", ")} {suffix}
                  </span>
                </p>
              );
            })}
          </div>
        ))}
    </div>
  );
}
