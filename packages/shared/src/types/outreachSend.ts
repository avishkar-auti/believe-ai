/**
 * Execution + follow-up tracking for an approved OutreachDraft — ported from
 * HireConnect's outreach_execution_agent. Two hard ethical guarantees this
 * type set exists to enforce (see docs/ethics.md in the reference):
 * (1) a "linkedin" channel log NEVER transitions to "sent" — LinkedIn notes
 *     are always logged "drafted" for the user to send manually, never
 *     auto-sent on their behalf.
 * (2) follow-ups are capped at 3 (day 3/7/14) and stop the moment the user
 *     marks the contact as replied — enforced independently at both the
 *     scheduling call site and the repository write, so one bug can't
 *     remove the ceiling.
 */
export type OutreachSendChannel = "email" | "linkedin";
export type OutreachSendStatus = "sent" | "drafted" | "failed" | "suppressed";
export type OutreachSendContentType = "cold_email" | "linkedin_note" | "follow_up";

export interface OutreachSendLog {
  id: string;
  userId: string;
  outreachDraftId: string;
  contactId: string;
  channel: OutreachSendChannel;
  status: OutreachSendStatus;
  contentType: OutreachSendContentType | null;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface OutreachFollowUp {
  id: string;
  userId: string;
  outreachDraftId: string;
  contactId: string;
  sequenceNumber: number;
  scheduledFor: string;
  sent: boolean;
  cancelled: boolean;
  cancelReason: string | null;
  createdAt: string;
}
