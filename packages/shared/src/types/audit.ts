/**
 * Audit trail of meaningful user actions (spec 39). Deliberately records
 * *what* happened, not the payload — metadata holds only non-sensitive
 * descriptors (names, counts), never credentials, tokens, or email bodies.
 */
export const AUDIT_ACTIONS = [
  "campaign.created",
  "campaign.launched",
  "campaign.paused",
  "campaign.resumed",
  "campaign.cancelled",
  "contacts.imported",
  "template.deleted",
  "integration.connected",
  "integration.disconnected",
  "job.created",
  "job.updated",
  "job.deleted",
  "job_intel.analyzed",
  "outreach_draft.generated",
  "outreach_draft.decided",
  "outreach_draft.sent",
  "outreach_draft.replied",
  "job_lead.discovered",
  "job_lead.added_to_contact",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditEntityType =
  | "campaign"
  | "contact"
  | "template"
  | "integration"
  | "job"
  | "job_intel"
  | "outreach_draft"
  | "job_lead";

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  metadata: Record<string, string | number | boolean>;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}
