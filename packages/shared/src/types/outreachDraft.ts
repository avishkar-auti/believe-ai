/**
 * AI-drafted outreach for a specific contact, grounded in a job analysis
 * (JobIntel) and — when available — the candidate's own resume. Every
 * draft starts "pending" and must be explicitly approved, edited, or
 * rejected by the user before anything is ever sent (Phase 4). Ported
 * from HireConnect's outreach_content_agent + human_approval_gate.
 */
export type DraftStatus = "pending" | "approved" | "edited" | "rejected";
export type HookConfidence = "high" | "low";
/** "referral" assumes an existing connection and asks for a referral instead
 * of the standard cold-email/connection-note pair. */
export type OutreachDraftIntent = "outreach" | "referral";

export interface OutreachDraftEditedText {
  coldEmail?: string;
  linkedinNote?: string;
  referralRequest?: string;
  coverLetter?: string;
}

export interface OutreachDraft {
  id: string;
  userId: string;
  jobIntelId: string;
  contactId: string;
  contactName: string;
  /** The real, verifiable fact the draft references — never an invented detail. */
  hook: string;
  hookConfidence: HookConfidence;
  coldEmail: string;
  /** Deterministically truncated to 300 characters after generation — the model isn't fully reliable at respecting a hard limit on its own. */
  linkedinNote: string;
  /** Null until warm-path contact detection exists (Phase 3 / lead_discovery). */
  referralRequest: string | null;
  /** Null when the user has no resume on file. */
  coverLetter: string | null;
  status: DraftStatus;
  editedText: OutreachDraftEditedText | null;
  createdAt: string;
  updatedAt: string;
}
