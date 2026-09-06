import type { AuditAction, AuditLog } from "@believe-ai/shared";

/** The human vocabulary for audit entries, shared by both dashboards so the
 * two presentations never drift into describing the same event differently. */
export const ACTION_LABELS: Record<AuditAction, string> = {
  "campaign.created": "Campaign created",
  "campaign.launched": "Campaign launched",
  "campaign.paused": "Campaign paused",
  "campaign.resumed": "Campaign resumed",
  "campaign.cancelled": "Campaign cancelled",
  "contacts.imported": "Contacts imported",
  "template.deleted": "Template deleted",
  "integration.connected": "Integration connected",
  "integration.disconnected": "Integration disconnected",
  "job.created": "Job posted",
  "job.updated": "Job updated",
  "job.deleted": "Job deleted",
  "job_intel.analyzed": "Job analyzed",
  "outreach_draft.generated": "Outreach drafts generated",
  "outreach_draft.decided": "Outreach draft reviewed",
  "outreach_draft.sent": "Outreach sent",
  "outreach_draft.replied": "Contact marked replied",
  "job_lead.discovered": "Contacts discovered",
  "job_lead.added_to_contact": "Discovered contact added",
};

/** Turns the entry's safe metadata into a short human detail line. */
export function describe(log: AuditLog): string {
  const { name, provider, imported } = log.metadata;
  if (typeof name === "string") return name;
  if (typeof provider === "string") return provider;
  if (typeof imported === "number") return `${imported} imported`;
  return "";
}

export function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
