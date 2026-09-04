/**
 * Campaign lifecycle and related recipient/email-log types.
 */
export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/**
 * Explicit allow-list of state transitions. Anything not listed here is invalid.
 */
export const CAMPAIGN_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["SCHEDULED", "RUNNING", "CANCELLED"],
  SCHEDULED: ["RUNNING", "CANCELLED"],
  RUNNING: ["PAUSED", "COMPLETED", "CANCELLED", "FAILED"],
  PAUSED: ["RUNNING", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: [],
};

/**
 * A follow-up sent some number of days after the previous step (the initial
 * send, or the prior follow-up) if the recipient hasn't replied or
 * unsubscribed by then.
 */
export interface CampaignFollowUp {
  templateId: string;
  delayDays: number;
  subjectOverride: string | null;
}

export interface CreateCampaignInput {
  name: string;
  subject: string;
  templateId: string;
  /** Attached to every send in this campaign, if set. Opt-in per campaign — never auto-filled from the Primary resume. */
  resumeId?: string | null;
  audienceContactIds: string[];
  scheduledAt?: string | null;
  timezone?: string;
  dailyLimit?: number;
  personalizationEnabled?: boolean;
  trackingEnabled?: boolean;
  followUps?: CampaignFollowUp[];
  stopOnReply?: boolean;
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  subject: string;
  templateId: string;
  resumeId: string | null;
  audienceContactIds: string[];
  status: CampaignStatus;
  scheduledAt: string | null;
  timezone: string;
  dailyLimit: number;
  personalizationEnabled: boolean;
  trackingEnabled: boolean;
  followUps: CampaignFollowUp[];
  stopOnReply: boolean;
  createdAt: string;
  updatedAt: string;
}

export const EMAIL_LOG_STATUSES = [
  "QUEUED",
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "REPLIED",
  "BOUNCED",
  "FAILED",
] as const;

export type EmailLogStatus = (typeof EMAIL_LOG_STATUSES)[number];

export interface EmailLog {
  id: string;
  campaignId: string;
  contactId: string;
  userId: string;
  /** 0 = the initial send, 1+ = index into the campaign's followUps array (1-based). */
  stepIndex: number;
  status: EmailLogStatus;
  providerMessageId: string | null;
  trackingToken: string;
  openCount: number;
  clickCount: number;
  replied: boolean;
  errorMessage: string | null;
  sentAt: string | null;
  openedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** An EmailLog enriched with the campaign/contact names for a cross-campaign tracking view. */
export interface EmailTrackingEntry extends EmailLog {
  campaignName: string;
  contactName: string;
  contactEmail: string;
}

export interface CampaignAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  failed: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
}
