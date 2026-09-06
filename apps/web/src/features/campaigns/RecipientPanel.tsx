import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, CircleCheck, Eye, Link2, Mail, MailX, MessageSquareText, TriangleAlert, X } from "lucide-react";
import type { EmailEventType, EmailLog } from "@believe-ai/shared";
import { Tabs } from "../../components/ui/Tabs.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { Button } from "../../components/ui/Button.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { EASE, MOTION } from "../../lib/motion.js";
import { fetchRecipientTimeline } from "./campaignsApi.js";
import { fetchContact, updateContact } from "../contacts/contactsApi.js";

const EVENT_ICON: Record<EmailEventType, typeof Mail> = {
  SENT: Mail,
  OPENED: Eye,
  CLICKED: Link2,
  REPLIED: MessageSquareText,
  BOUNCED: TriangleAlert,
  FAILED: TriangleAlert,
  UNSUBSCRIBED: MailX,
  COMPLAINED: TriangleAlert,
};

// "Open detected" rather than "Recruiter read your email" — a pixel firing
// is a signal (and can be blocked by the client), never a read receipt.
const EVENT_LABEL: Record<EmailEventType, string> = {
  SENT: "Email sent",
  OPENED: "Open detected",
  CLICKED: "Link clicked",
  REPLIED: "Reply detected",
  BOUNCED: "Bounced",
  FAILED: "Send failed",
  UNSUBSCRIBED: "Unsubscribed",
  COMPLAINED: "Marked as spam",
};

const TABS = [
  { value: "activity", label: "Activity" },
  { value: "details", label: "Details" },
  { value: "notes", label: "Notes" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** A right-docked, always-visible-while-open panel (not a modal) — closer
 * to a real inbox's contact-detail rail than a centered dialog, matching
 * how a recruiter/recipient's engagement is something you'd want open
 * alongside the recipient table, not blocking it. */
export function RecipientPanel({ campaignId, recipient, onClose }: { campaignId: string; recipient: EmailLog | null; onClose: () => void }) {
  const [tab, setTab] = useState("activity");
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["campaign", campaignId, "recipient-timeline", recipient?.contactId],
    queryFn: () => fetchRecipientTimeline(campaignId, recipient!.contactId),
    enabled: Boolean(recipient),
  });

  const { data: contact, isLoading: contactLoading } = useQuery({
    queryKey: ["contact", recipient?.contactId],
    queryFn: () => fetchContact(recipient!.contactId),
    enabled: Boolean(recipient),
  });

  useEffect(() => {
    setNotes(contact?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-seed the draft only when a different contact loads, not on every notes edit
  }, [contact?.id]);

  useEffect(() => {
    if (recipient) setTab("activity");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset the tab only when the selected recipient changes, not on every field update
  }, [recipient?.id]);

  const saveNotesMutation = useMutation({
    mutationFn: () => updateContact(recipient!.contactId, { notes }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["contact", recipient?.contactId] }),
  });

  return (
    <AnimatePresence>
      {recipient && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.fast }}
            className="fixed inset-0 z-[55] bg-black/20 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: MOTION.normal, ease: EASE }}
            className="fixed right-0 top-0 z-[56] flex h-full w-full max-w-sm flex-col border-l border-ink-100 bg-white shadow-lift dark:border-ink-800 dark:bg-ink-900"
          >
            <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 dark:border-ink-800">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                  {initials(recipient.contactName || "?")}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900 dark:text-white">{recipient.contactName || "Recipient"}</p>
                  <p className="truncate text-xs text-ink-400">{recipient.contactEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {recipient.contactCompany && (
              <p className="flex items-center gap-1.5 border-b border-ink-100 px-5 py-2.5 text-xs text-ink-400 dark:border-ink-800">
                <Building2 className="h-3.5 w-3.5" /> {recipient.contactCompany}
              </p>
            )}

            <div className="border-b border-ink-100 px-5 dark:border-ink-800">
              <Tabs items={TABS} value={tab} onChange={setTab} ariaLabel="Recipient detail" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {tab === "activity" &&
                (eventsLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Spinner className="h-5 w-5 text-brand-500" />
                  </div>
                ) : !events || events.length === 0 ? (
                  <p className="text-sm text-ink-500 dark:text-ink-400">No activity recorded yet.</p>
                ) : (
                  <ol className="space-y-4">
                    {events.map((event) => {
                      const Icon = EVENT_ICON[event.type];
                      return (
                        <li key={event.id} className="flex gap-3">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{EVENT_LABEL[event.type]}</p>
                            {event.linkUrl && <p className="truncate text-xs text-ink-400">{event.linkUrl}</p>}
                            <p className="text-xs text-ink-400">{new Date(event.createdAt).toLocaleString()}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ))}

              {tab === "details" &&
                (contactLoading || !contact ? (
                  <div className="flex h-32 items-center justify-center">
                    <Spinner className="h-5 w-5 text-brand-500" />
                  </div>
                ) : (
                  <dl className="space-y-3 text-sm">
                    {[
                      ["Email", contact.email],
                      ["Company", contact.company],
                      ["Job title", contact.jobTitle],
                      ["Phone", contact.phone],
                      ["Step", `Step ${recipient.stepIndex}`],
                      ["Status", recipient.status],
                      ["Sent", recipient.sentAt ? new Date(recipient.sentAt).toLocaleString() : null],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
                          <dd className="text-ink-800 dark:text-ink-100">{value}</dd>
                        </div>
                      ))}
                  </dl>
                ))}

              {tab === "notes" && (
                <div className="space-y-3">
                  <Textarea rows={8} placeholder="Notes on this recipient…" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => saveNotesMutation.mutate()} disabled={saveNotesMutation.isPending}>
                      {saveNotesMutation.isPending ? "Saving…" : "Save notes"}
                    </Button>
                    {saveNotesMutation.isSuccess && <span className="text-xs text-positive">Saved</span>}
                  </div>
                </div>
              )}
            </div>

            {recipient.replied && (
              <p className="flex items-center gap-1.5 border-t border-ink-100 px-5 py-3 text-xs text-positive dark:border-ink-800">
                <CircleCheck className="h-3.5 w-3.5" /> This recipient has replied.
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
