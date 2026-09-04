/**
 * A person discovered at a target company for a specific job analysis
 * (JobIntel) — ported from HireConnect's lead_discovery_agent (hiring team +
 * employee discovery + contact enrichment, merged). Deliberately kept
 * separate from the main Contact address book: `workEmailPattern` is an
 * inferred convention (e.g. first.last@company.com), never a verified
 * address, so a JobLead can only become a real, sendable Contact through an
 * explicit "add to contacts" step where the user supplies a real email.
 */
export type RelationshipStatus = "connected" | "not_connected" | "unknown";

export interface JobLead {
  id: string;
  userId: string;
  jobIntelId: string;
  name: string;
  title: string | null;
  /** The original headline text a profile was found with — kept separate
   * from `title` for debugging, even though today they're the same value. */
  headline: string | null;
  location: string | null;
  linkedinUrl: string | null;
  relevanceRank: number;
  /** 0-100, explainable — see relevanceReasons for what produced it. */
  relevanceScore: number;
  relevanceReasons: string[];
  /** Always "unknown" today — no LinkedIn integration can honestly return
   * "connected"/"not_connected" without partner-tier API access. See
   * services/relationship_service.py. */
  relationshipStatus: RelationshipStatus;
  warmPath: boolean;
  /** The real, verifiable fact behind a warm-path flag — e.g. a prior employer
   * that also appears in the candidate's own resume. Never invented. */
  warmPathReason: string | null;
  /** Inferred from name + company domain — explicitly not guaranteed to be correct. */
  workEmailPattern: string | null;
  addedContactId: string | null;
  createdAt: string;
}
