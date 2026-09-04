import { CAMPAIGN_STATUS_TRANSITIONS, type CampaignStatus, type EmailLogStatus } from "@believe-ai/shared";

export const CAMPAIGN_STATUS_TONE: Record<CampaignStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  DRAFT: "neutral",
  SCHEDULED: "info",
  RUNNING: "success",
  PAUSED: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
  FAILED: "danger",
};

export const CAMPAIGN_STATUS_DOT: Record<CampaignStatus, string> = {
  DRAFT: "bg-ink-400",
  SCHEDULED: "bg-blue-500",
  RUNNING: "bg-lime-500",
  PAUSED: "bg-amber-500",
  COMPLETED: "bg-lime-500",
  CANCELLED: "bg-red-500",
  FAILED: "bg-red-500",
};

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  RUNNING: "Running",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

/** Screen-reader text for the status dot — announced even when the visible
 * label is hidden (e.g. a compact table row), so state never depends on
 * seeing a color alone. */
export const CAMPAIGN_STATUS_GLYPH: Record<CampaignStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled to send",
  RUNNING: "Currently sending",
  PAUSED: "Sending paused",
  COMPLETED: "Finished sending",
  CANCELLED: "Cancelled",
  FAILED: "Failed to send",
};

/**
 * Which row actions a campaign's current status permits, derived from the
 * same CAMPAIGN_STATUS_TRANSITIONS the backend's state machine enforces
 * (services/campaign_service.py's _assert_transition) — so the UI never
 * offers an action the API would reject.
 */
export function allowedActions(status: CampaignStatus): {
  launch: boolean;
  pause: boolean;
  resume: boolean;
  cancel: boolean;
} {
  const next = CAMPAIGN_STATUS_TRANSITIONS[status];
  return {
    launch: next.includes("RUNNING") && status !== "PAUSED",
    pause: next.includes("PAUSED"),
    resume: status === "PAUSED" && next.includes("RUNNING"),
    cancel: next.includes("CANCELLED"),
  };
}

export const EMAIL_LOG_LABEL: Record<EmailLogStatus, string> = {
  QUEUED: "Queued",
  SENT: "Sent",
  DELIVERED: "Delivered",
  OPENED: "Opened",
  CLICKED: "Clicked",
  REPLIED: "Replied",
  BOUNCED: "Bounced",
  FAILED: "Failed",
};

export const EMAIL_LOG_TONE: Record<EmailLogStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  QUEUED: "neutral",
  SENT: "info",
  DELIVERED: "info",
  OPENED: "success",
  CLICKED: "success",
  REPLIED: "success",
  BOUNCED: "danger",
  FAILED: "danger",
};
