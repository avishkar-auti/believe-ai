/**
 * A person discovered at a target company for a specific job analysis
 * (JobIntel) — ported from HireConnect's lead_discovery_agent (hiring team +
 * employee discovery + contact enrichment, merged). Deliberately kept
 * separate from the main Contact address book: `workEmailPattern` is an
 * inferred convention (e.g. first.last@company.com), never a verified
 * address, so a JobLead can only become a real, sendable Contact through an
 * explicit "add to contacts" step where the user supplies a real email.
 */
export interface JobLead {
  id: string;
  userId: string;
  jobIntelId: string;
  name: string;
  title: string | null;
  linkedinUrl: string | null;
  relevanceRank: number;
  warmPath: boolean;
  /** The real, verifiable fact behind a warm-path flag — e.g. a prior employer
   * that also appears in the candidate's own resume. Never invented. */
  warmPathReason: string | null;
  /** Inferred from name + company domain — explicitly not guaranteed to be correct. */
  workEmailPattern: string | null;
  addedContactId: string | null;
  createdAt: string;
}
