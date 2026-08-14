import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Clock, Linkedin, Mail, Pencil, Send, Sparkles, X } from "lucide-react";
import type { DraftStatus, OutreachDraft, OutreachSendStatus } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { fetchContacts } from "../contacts/contactsApi.js";
import { decideOutreachDraft, fetchOutreachDrafts, generateOutreachDrafts } from "./outreachDraftApi.js";
import { fetchOutreachFollowUps, fetchOutreachSendLogs, markOutreachReplied, sendOutreachDraft } from "./outreachSendApi.js";

const SEND_STATUS_TONE: Record<OutreachSendStatus, "success" | "warning" | "danger" | "neutral"> = {
  sent: "success",
  drafted: "neutral",
  failed: "danger",
  suppressed: "warning",
};

const STATUS_TONE: Record<DraftStatus, "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  edited: "success",
  rejected: "danger",
};

export function OutreachDraftPanel({ jobIntelId }: { jobIntelId: string }) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const draftsQuery = useQuery({
    queryKey: ["outreachDrafts", jobIntelId],
    queryFn: () => fetchOutreachDrafts(jobIntelId),
    enabled: open,
  });

  const contactsQuery = useQuery({
    queryKey: ["contacts", "picker"],
    queryFn: () => fetchContacts({ page: 1 }),
    enabled: pickerOpen,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateOutreachDrafts(jobIntelId, selectedContactIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["outreachDrafts", jobIntelId] });
      setPickerOpen(false);
      setSelectedContactIds([]);
    },
  });

  function toggleContact(id: string) {
    setSelectedContactIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  return (
    <div className="border-t border-ink-100 pt-4 dark:border-ink-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400 hover:text-ink-600 dark:hover:text-ink-300"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        Outreach drafts
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {!pickerOpen ? (
            <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" /> Generate drafts
            </Button>
          ) : (
            <Card>
              <CardBody className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Pick contacts</p>
                {contactsQuery.isLoading ? (
                  <Spinner className="h-4 w-4 text-ink-400" />
                ) : !contactsQuery.data || contactsQuery.data.items.length === 0 ? (
                  <p className="text-sm text-ink-500 dark:text-ink-400">No contacts yet — add some first.</p>
                ) : (
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {contactsQuery.data.items.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-50 dark:hover:bg-ink-800/60"
                      >
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(c.id)}
                          onChange={() => toggleContact(c.id)}
                          className="h-4 w-4 rounded border-ink-300"
                        />
                        <span className="text-ink-900 dark:text-white">
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="text-ink-400">{c.email}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => generateMutation.mutate()}
                    disabled={selectedContactIds.length === 0 || generateMutation.isPending}
                  >
                    {generateMutation.isPending ? "Generating…" : `Generate for ${selectedContactIds.length || ""} contact${selectedContactIds.length === 1 ? "" : "s"}`}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPickerOpen(false)}>
                    Cancel
                  </Button>
                </div>
                {generateMutation.isError && (
                  <p className="text-sm text-red-600">
                    {(generateMutation.error as { message?: string })?.message || "Couldn't generate drafts."}
                  </p>
                )}
              </CardBody>
            </Card>
          )}

          {draftsQuery.isLoading ? (
            <Spinner className="h-4 w-4 text-ink-400" />
          ) : (
            draftsQuery.data?.map((draft) => <DraftCard key={draft.id} draft={draft} jobIntelId={jobIntelId} />)
          )}
        </div>
      )}
    </div>
  );
}

function DraftCard({ draft, jobIntelId }: { draft: OutreachDraft; jobIntelId: string }) {
  const [editing, setEditing] = useState(false);
  const [coldEmail, setColdEmail] = useState(draft.editedText?.coldEmail ?? draft.coldEmail);
  const [linkedinNote, setLinkedinNote] = useState(draft.editedText?.linkedinNote ?? draft.linkedinNote);
  const queryClient = useQueryClient();

  const decideMutation = useMutation({
    mutationFn: (status: DraftStatus) =>
      decideOutreachDraft(draft.id, status, status === "edited" ? { coldEmail, linkedinNote } : null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["outreachDrafts", jobIntelId] });
      setEditing(false);
    },
  });

  const shownColdEmail = draft.editedText?.coldEmail ?? draft.coldEmail;
  const shownLinkedinNote = draft.editedText?.linkedinNote ?? draft.linkedinNote;

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-ink-900 dark:text-white">{draft.contactName}</p>
          <Badge tone={STATUS_TONE[draft.status]}>{draft.status}</Badge>
        </div>

        <div className="rounded-lg bg-ink-50 p-2.5 text-xs text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
          <span className="font-semibold">Hook</span> ({draft.hookConfidence === "high" ? "grounded" : "low-confidence"}): {draft.hook}
        </div>

        {editing ? (
          <div className="space-y-2">
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                <Mail className="h-3 w-3" /> Cold email
              </p>
              <textarea
                value={coldEmail}
                onChange={(e) => setColdEmail(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm text-ink-900 focus:border-ink-900 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                LinkedIn note ({linkedinNote.length}/300)
              </p>
              <textarea
                value={linkedinNote}
                onChange={(e) => setLinkedinNote(e.target.value.slice(0, 300))}
                rows={3}
                className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm text-ink-900 focus:border-ink-900 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                <Mail className="h-3 w-3" /> Cold email
              </p>
              <p className="whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-300">{shownColdEmail}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">LinkedIn note</p>
              <p className="whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-300">{shownLinkedinNote}</p>
            </div>
            {draft.coverLetter && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">Cover letter</p>
                <p className="whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-300">{draft.coverLetter}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {editing ? (
            <>
              <Button size="sm" onClick={() => decideMutation.mutate("edited")} disabled={decideMutation.isPending}>
                <Check className="h-3.5 w-3.5" /> Save edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            draft.status === "pending" && (
              <>
                <Button size="sm" onClick={() => decideMutation.mutate("approved")} disabled={decideMutation.isPending}>
                  <Send className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => decideMutation.mutate("rejected")} disabled={decideMutation.isPending}>
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </>
            )
          )}
        </div>

        {(draft.status === "approved" || draft.status === "edited") && <SendSection draft={draft} />}
      </CardBody>
    </Card>
  );
}

function SendSection({ draft }: { draft: OutreachDraft }) {
  const queryClient = useQueryClient();

  const sendLogsQuery = useQuery({
    queryKey: ["outreachSendLogs", draft.id],
    queryFn: () => fetchOutreachSendLogs(draft.id),
  });
  const followUpsQuery = useQuery({
    queryKey: ["outreachFollowUps", draft.id],
    queryFn: () => fetchOutreachFollowUps(draft.id),
    enabled: (sendLogsQuery.data?.length ?? 0) > 0,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendOutreachDraft(draft.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["outreachSendLogs", draft.id] }),
  });

  const repliedMutation = useMutation({
    mutationFn: () => markOutreachReplied(draft.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["outreachFollowUps", draft.id] }),
  });

  const hasSent = (sendLogsQuery.data?.length ?? 0) > 0;
  const pendingFollowUp = followUpsQuery.data?.find((f) => !f.sent && !f.cancelled);

  return (
    <div className="space-y-2 border-t border-ink-100 pt-3 dark:border-ink-800">
      {!hasSent ? (
        <>
          <Button size="sm" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
            {sendMutation.isPending ? "Sending…" : "Send outreach"}
          </Button>
          {sendMutation.isError && (
            <p className="text-sm text-red-600">
              {(sendMutation.error as { message?: string })?.message || "Couldn't send."}
            </p>
          )}
        </>
      ) : (
        <div className="space-y-1.5">
          {sendLogsQuery.data?.map((log) => (
            <div key={log.id} className="flex items-center gap-2 text-xs">
              {log.channel === "linkedin" ? <Linkedin className="h-3.5 w-3.5 text-ink-400" /> : <Mail className="h-3.5 w-3.5 text-ink-400" />}
              <Badge tone={SEND_STATUS_TONE[log.status]}>{log.status}</Badge>
              <span className="text-ink-500 dark:text-ink-400">
                {log.channel === "linkedin"
                  ? "Copy the LinkedIn note above and send it yourself — never sent automatically."
                  : (log.errorMessage ?? (log.status === "sent" ? "Sent to " + draft.contactName : ""))}
              </span>
            </div>
          ))}
          {pendingFollowUp && (
            <div className="flex items-center gap-2 pt-1 text-xs text-ink-500 dark:text-ink-400">
              <Clock className="h-3.5 w-3.5" />
              Next follow-up: {new Date(pendingFollowUp.scheduledFor).toLocaleDateString()}
              <Button variant="ghost" size="sm" onClick={() => repliedMutation.mutate()} disabled={repliedMutation.isPending}>
                Mark as replied
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
